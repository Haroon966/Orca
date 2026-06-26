import { useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useClaudeConfigEditorTheme } from '../../../hooks/useClaudeConfigEditorTheme';
import SettingsCard from '../../SettingsCard';
import SettingsSection from '../../SettingsSection';
import type { ConfigFileEntry } from '../../../hooks/useClaudeConfig';

type ConfigBrowserSectionProps = {
  title: string;
  description: string;
  files: ConfigFileEntry[];
  emptyMessage: string;
  onRead: (filePath: string) => Promise<{ content: string; path: string }>;
  readOnly?: boolean;
};

export default function ConfigBrowserSection({
  title,
  description,
  files,
  emptyMessage,
  onRead,
  readOnly = true,
}: ConfigBrowserSectionProps) {
  const { t } = useTranslation('settings');
  const editorTheme = useClaudeConfigEditorTheme();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSelect = async (filePath: string) => {
    setSelectedPath(filePath);
    setLoading(true);
    setLoadError(null);
    try {
      const data = await onRead(filePath);
      setContent(data.content);
    } catch {
      setContent('');
      setLoadError(t('claudeConfig.readFailed', { defaultValue: 'Failed to read file' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection title={title} description={description}>
      <SettingsCard className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t('claudeConfig.readOnly', { defaultValue: 'Read-only' })}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            {files.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <ul className="divide-y divide-border">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      aria-selected={selectedPath === file.path}
                      onClick={() => void handleSelect(file.path)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-accent/50 ${
                        selectedPath === file.path ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <div className="truncate font-medium">{file.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[file.scope, file.relativePath].filter(Boolean).join(' · ')}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            {selectedPath ? (
              <>
                {loadError && (
                  <p className="mb-2 text-sm text-red-600 dark:text-red-400">{loadError}</p>
                )}
                <div className="overflow-hidden rounded-lg border border-border">
                  {loading ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('claudeConfig.fileLoading', { defaultValue: 'Loading…' })}
                    </div>
                  ) : (
                    <CodeMirror
                      value={content}
                      onChange={readOnly ? undefined : setContent}
                      extensions={[markdown(), EditorView.lineWrapping]}
                      theme={editorTheme}
                      height="200px"
                      editable={!readOnly}
                      basicSetup={{ lineNumbers: true, foldGutter: true }}
                    />
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('claudeConfig.selectPreview', { defaultValue: 'Select an entry to preview.' })}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

import { useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../../../shared/view/ui';
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
  onSave?: (filePath: string, content: string) => Promise<void>;
  readOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function ConfigBrowserSection({
  title,
  description,
  files,
  emptyMessage,
  onRead,
  onSave,
  readOnly = false,
  onDirtyChange,
}: ConfigBrowserSectionProps) {
  const { t } = useTranslation('settings');
  const editorTheme = useClaudeConfigEditorTheme();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = !readOnly && selectedPath !== null && content !== savedContent;

  const reportDirty = (dirty: boolean) => {
    onDirtyChange?.(dirty);
  };

  const handleSelect = async (filePath: string) => {
    setSelectedPath(filePath);
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    try {
      const data = await onRead(filePath);
      setContent(data.content);
      setSavedContent(data.content);
      reportDirty(false);
    } catch {
      setContent('');
      setSavedContent('');
      setLoadError(t('claudeConfig.readFailed', { defaultValue: 'Failed to read file' }));
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    reportDirty(value !== savedContent);
  };

  const handleSave = async () => {
    if (!selectedPath || !onSave || readOnly) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(selectedPath, content);
      setSavedContent(content);
      reportDirty(false);
    } catch {
      setSaveError(t('claudeConfig.saveFailed', { defaultValue: 'Failed to save file' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title={title} description={description}>
      <SettingsCard className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {readOnly
              ? t('claudeConfig.readOnly', { defaultValue: 'Read-only' })
              : t('claudeConfig.editable', { defaultValue: 'Editable' })}
          </span>
          {!readOnly && onSave && selectedPath && (
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={!isDirty || saving || loading}
            >
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              {t('claudeConfig.save', { defaultValue: 'Save' })}
            </Button>
          )}
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
                {saveError && (
                  <p className="mb-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
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
                      onChange={readOnly ? undefined : handleContentChange}
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

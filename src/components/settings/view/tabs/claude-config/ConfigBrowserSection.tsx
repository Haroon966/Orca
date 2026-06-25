import { useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

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
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (filePath: string) => {
    setSelectedPath(filePath);
    setLoading(true);
    try {
      const data = await onRead(filePath);
      setContent(data.content);
    } catch {
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection title={title} description={description}>
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
            <div className="overflow-hidden rounded-lg border border-border">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
              ) : (
                <CodeMirror
                  value={content}
                  onChange={readOnly ? undefined : setContent}
                  extensions={[markdown(), EditorView.lineWrapping]}
                  theme={oneDark}
                  height="200px"
                  editable={!readOnly}
                  basicSetup={{ lineNumbers: true, foldGutter: true }}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an entry to preview.</p>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

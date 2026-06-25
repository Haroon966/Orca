import { useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Save } from 'lucide-react';

import { Button } from '../../../../../shared/view/ui';
import SettingsSection from '../../SettingsSection';
import type { ConfigFileEntry } from '../../../hooks/useClaudeConfig';

type MemoryBrowserSectionProps = {
  files: ConfigFileEntry[];
  onRead: (filePath: string) => Promise<{ content: string; path: string }>;
  onSave: (filePath: string, content: string) => Promise<void>;
};

export default function MemoryBrowserSection({ files, onRead, onSave }: MemoryBrowserSectionProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      await onSave(selectedPath, content);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Memory"
      description="Browse and edit Claude auto-memory markdown files under ~/.claude."
    >
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
          {files.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No memory files found.</p>
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
                    <div className="truncate font-medium">{file.relativePath}</div>
                    {file.root && (
                      <div className="truncate text-xs text-muted-foreground">{file.root}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          {selectedPath ? (
            <>
              <p className="truncate font-mono text-xs text-muted-foreground">{selectedPath}</p>
              <div className="overflow-hidden rounded-lg border border-border">
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                ) : (
                  <CodeMirror
                    value={content}
                    onChange={setContent}
                    extensions={[markdown(), EditorView.lineWrapping]}
                    theme={oneDark}
                    height="240px"
                    basicSetup={{ lineNumbers: true, foldGutter: true }}
                  />
                )}
              </div>
              <Button onClick={() => void handleSave()} disabled={saving || loading}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Save memory file'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a file to view or edit.</p>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

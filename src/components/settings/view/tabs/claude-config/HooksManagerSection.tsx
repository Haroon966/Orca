import { useEffect, useMemo, useState } from 'react';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Save } from 'lucide-react';

import { Button } from '../../../../../shared/view/ui';
import SettingsSection from '../../SettingsSection';
import type { HooksScope } from '../../../hooks/useClaudeConfig';

type HooksManagerSectionProps = {
  hooksScopes: HooksScope[];
  onSave: (scope: string, hooks: Record<string, unknown>) => Promise<void>;
};

export default function HooksManagerSection({ hooksScopes, onSave }: HooksManagerSectionProps) {
  const [selectedScope, setSelectedScope] = useState(hooksScopes[0]?.scope ?? 'user');
  const [content, setContent] = useState('{}');
  const [filePath, setFilePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const selectedEntry = useMemo(
    () => hooksScopes.find((entry) => entry.scope === selectedScope),
    [hooksScopes, selectedScope],
  );

  useEffect(() => {
    if (hooksScopes.length > 0 && !hooksScopes.some((entry) => entry.scope === selectedScope)) {
      setSelectedScope(hooksScopes[0].scope);
    }
  }, [hooksScopes, selectedScope]);

  useEffect(() => {
    if (!selectedEntry) {
      setContent('{}');
      setFilePath('');
      return;
    }

    setContent(JSON.stringify(selectedEntry.hooks ?? {}, null, 2));
    setFilePath(selectedEntry.path);
  }, [selectedEntry]);

  const extensions = useMemo(() => [json(), EditorView.lineWrapping], []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      await onSave(selectedScope, parsed);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Hooks"
      description="Edit Claude Code event hooks (PreToolUse, PostToolUse, SessionStart, etc.) in settings.json."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {hooksScopes.map((entry) => (
            <Button
              key={entry.scope}
              variant={selectedScope === entry.scope ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScope(entry.scope)}
            >
              {entry.scope}
              {!entry.exists && ' (new)'}
            </Button>
          ))}
        </div>

        {filePath && (
          <p className="truncate font-mono text-xs text-muted-foreground">{filePath}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={extensions}
            theme={oneDark}
            height="240px"
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save hooks'}
          </Button>
          {saveStatus === 'success' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600">Invalid JSON or save failed</span>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

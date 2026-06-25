import { useEffect, useMemo, useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { FileText, GitBranch, Save } from 'lucide-react';

import { Button } from '../../../../../shared/view/ui';
import SettingsSection from '../../SettingsSection';
import type { ClaudeMdFile, ClaudeMdLevel } from '../../../hooks/useClaudeConfig';

type ClaudeMdEditorSectionProps = {
  projectPath?: string;
  claudeMdFiles: ClaudeMdFile[];
  readClaudeMd: (level: ClaudeMdLevel) => Promise<{ content: string; path: string }>;
  saveClaudeMd: (level: ClaudeMdLevel, content: string) => Promise<void>;
};

const LEVEL_LABELS: Record<ClaudeMdLevel, string> = {
  global: 'Global (user)',
  project: 'Project',
  local: 'Local',
  private: 'Private',
};

export default function ClaudeMdEditorSection({
  projectPath,
  claudeMdFiles,
  readClaudeMd,
  saveClaudeMd,
}: ClaudeMdEditorSectionProps) {
  const [selectedLevel, setSelectedLevel] = useState<ClaudeMdLevel>('global');
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const availableLevels = useMemo(
    () => claudeMdFiles.map((file) => file.level),
    [claudeMdFiles],
  );

  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(selectedLevel)) {
      setSelectedLevel(availableLevels[0]);
    }
  }, [availableLevels, selectedLevel]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await readClaudeMd(selectedLevel);
        if (!cancelled) {
          setContent(data.content);
          setFilePath(data.path);
        }
      } catch {
        if (!cancelled) {
          setContent('');
          setFilePath('');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [readClaudeMd, selectedLevel]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveClaudeMd(selectedLevel, content);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const extensions = useMemo(() => [markdown(), EditorView.lineWrapping], []);

  return (
    <SettingsSection
      title="CLAUDE.md Editor"
      description="Edit Claude memory files at each configuration level. Changes are written directly to the files Claude CLI reads."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {availableLevels.map((level) => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel(level)}
            >
              {LEVEL_LABELS[level]}
            </Button>
          ))}
        </div>

        {filePath && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate font-mono">{filePath}</span>
          </p>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <CodeMirror
              value={content}
              onChange={setContent}
              extensions={extensions}
              theme={oneDark}
              height="320px"
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save CLAUDE.md'}
          </Button>
          {saveStatus === 'success' && (
            <span className="text-xs text-green-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600">Save failed</span>
          )}
        </div>

        {!projectPath && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            Select a project below to edit project, local, and private CLAUDE.md files.
          </p>
        )}
      </div>
    </SettingsSection>
  );
}

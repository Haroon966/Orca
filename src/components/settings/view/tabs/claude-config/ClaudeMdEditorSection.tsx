import { useCallback, useEffect, useMemo, useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { FileText, GitBranch, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../../../shared/view/ui';
import { useClaudeConfigEditorTheme } from '../../../hooks/useClaudeConfigEditorTheme';
import {
  useGuardedAction,
  useUnsavedChangesReporter,
} from '../../../hooks/useUnsavedChangesConfirm';
import SettingsCard from '../../SettingsCard';
import SettingsSection from '../../SettingsSection';
import type { ClaudeMdFile, ClaudeMdLevel } from '../../../hooks/useClaudeConfig';
import ClaudeConfigSaveStatus from './ClaudeConfigSaveStatus';

type ClaudeMdEditorSectionProps = {
  projectPath?: string;
  claudeMdFiles: ClaudeMdFile[];
  readClaudeMd: (level: ClaudeMdLevel) => Promise<{ content: string; path: string }>;
  saveClaudeMd: (level: ClaudeMdLevel, content: string) => Promise<void>;
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function ClaudeMdEditorSection({
  projectPath,
  claudeMdFiles,
  readClaudeMd,
  saveClaudeMd,
  disabled = false,
  onDirtyChange,
}: ClaudeMdEditorSectionProps) {
  const { t } = useTranslation('settings');
  const editorTheme = useClaudeConfigEditorTheme();
  const [selectedLevel, setSelectedLevel] = useState<ClaudeMdLevel>('global');
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const isDirty = content !== savedContent;
  useUnsavedChangesReporter(isDirty, onDirtyChange);
  const runGuarded = useGuardedAction(isDirty, t('claudeConfig.unsavedConfirm', {
    defaultValue: 'You have unsaved CLAUDE.md changes. Discard them?',
  }));

  const levelLabels: Record<ClaudeMdLevel, string> = {
    global: t('claudeConfig.levels.global', { defaultValue: 'Global (user)' }),
    project: t('claudeConfig.levels.project', { defaultValue: 'Project' }),
    local: t('claudeConfig.levels.local', { defaultValue: 'Local' }),
    private: t('claudeConfig.levels.private', { defaultValue: 'Private' }),
  };

  const availableLevels = useMemo(
    () => claudeMdFiles.map((file) => file.level),
    [claudeMdFiles],
  );

  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(selectedLevel)) {
      setSelectedLevel(availableLevels[0]);
    }
  }, [availableLevels, selectedLevel]);

  const loadLevel = useCallback(async (level: ClaudeMdLevel) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await readClaudeMd(level);
      setContent(data.content);
      setSavedContent(data.content);
      setFilePath(data.path);
    } catch {
      setContent('');
      setSavedContent('');
      setFilePath('');
      setLoadError(t('claudeConfig.readFailed', { defaultValue: 'Failed to read file' }));
    } finally {
      setLoading(false);
    }
  }, [readClaudeMd, t]);

  useEffect(() => {
    void loadLevel(selectedLevel);
  }, [loadLevel, selectedLevel]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveClaudeMd(selectedLevel, content);
      setSavedContent(content);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [content, saveClaudeMd, selectedLevel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (!saving && !loading && !disabled) {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, handleSave, loading, saving]);

  const extensions = useMemo(() => [markdown(), EditorView.lineWrapping], []);

  return (
    <SettingsSection
      title={t('claudeConfig.claudeMdTitle', { defaultValue: 'CLAUDE.md Editor' })}
      description={t('claudeConfig.claudeMdDescription', {
        defaultValue: 'Edit Claude memory files at each configuration level. Changes are written directly to the files Claude CLI reads.',
      })}
    >
      <SettingsCard className="space-y-4 p-4">
        {availableLevels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('claudeConfig.claudeMdEmpty', { defaultValue: 'No CLAUDE.md levels available yet.' })}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="tablist">
            {availableLevels.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'outline'}
                size="sm"
                role="tab"
                aria-selected={selectedLevel === level}
                onClick={() => runGuarded(() => setSelectedLevel(level))}
              >
                {levelLabels[level]}
              </Button>
            ))}
          </div>
        )}

        {filePath && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate font-mono">{filePath}</span>
          </p>
        )}

        {loadError && (
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('claudeConfig.fileLoading', { defaultValue: 'Loading…' })}
            </div>
          ) : (
            <CodeMirror
              value={content}
              onChange={setContent}
              extensions={extensions}
              theme={editorTheme}
              height="320px"
              editable={!disabled}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={saving || loading || disabled || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? t('claudeConfig.saving', { defaultValue: 'Saving…' })
              : t('claudeConfig.saveClaudeMd', { defaultValue: 'Save CLAUDE.md' })}
          </Button>
          <ClaudeConfigSaveStatus status={saveStatus} />
        </div>

        {!projectPath && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            {t('claudeConfig.selectProjectAbove', {
              defaultValue: 'Select a project above to edit project, local, and private CLAUDE.md files.',
            })}
          </p>
        )}
      </SettingsCard>
    </SettingsSection>
  );
}

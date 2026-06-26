import { useCallback, useEffect, useState } from 'react';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../../../shared/view/ui';
import { useClaudeConfigEditorTheme } from '../../../hooks/useClaudeConfigEditorTheme';
import {
  useGuardedAction,
  useUnsavedChangesReporter,
} from '../../../hooks/useUnsavedChangesConfirm';
import SettingsCard from '../../SettingsCard';
import SettingsSection from '../../SettingsSection';
import type { ConfigFileEntry } from '../../../hooks/useClaudeConfig';
import ClaudeConfigSaveStatus from './ClaudeConfigSaveStatus';

type MemoryBrowserSectionProps = {
  files: ConfigFileEntry[];
  onRead: (filePath: string) => Promise<{ content: string; path: string }>;
  onSave: (filePath: string, content: string) => Promise<void>;
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function MemoryBrowserSection({
  files,
  onRead,
  onSave,
  disabled = false,
  onDirtyChange,
}: MemoryBrowserSectionProps) {
  const { t } = useTranslation('settings');
  const editorTheme = useClaudeConfigEditorTheme();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const isDirty = content !== savedContent;
  useUnsavedChangesReporter(isDirty, onDirtyChange);
  const runGuarded = useGuardedAction(isDirty, t('claudeConfig.unsavedConfirm', {
    defaultValue: 'You have unsaved changes. Discard them?',
  }));

  const handleSelect = useCallback(async (filePath: string) => {
    setSelectedPath(filePath);
    setLoading(true);
    setLoadError(null);
    setSaveStatus(null);
    try {
      const data = await onRead(filePath);
      setContent(data.content);
      setSavedContent(data.content);
    } catch {
      setContent('');
      setSavedContent('');
      setLoadError(t('claudeConfig.readFailed', { defaultValue: 'Failed to read file' }));
    } finally {
      setLoading(false);
    }
  }, [onRead, t]);

  const handleSave = useCallback(async () => {
    if (!selectedPath) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await onSave(selectedPath, content);
      setSavedContent(content);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [content, onSave, selectedPath]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (!saving && !loading && !disabled && selectedPath) {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, handleSave, loading, saving, selectedPath]);

  return (
    <SettingsSection
      title={t('claudeConfig.memoryTitle', { defaultValue: 'Memory' })}
      description={t('claudeConfig.memoryDescription', {
        defaultValue: 'Browse and edit Claude auto-memory markdown files under ~/.claude.',
      })}
    >
      <SettingsCard className="p-4">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {files.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {t('claudeConfig.memoryEmpty', { defaultValue: 'No memory files found.' })}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      aria-selected={selectedPath === file.path}
                      onClick={() => runGuarded(() => void handleSelect(file.path))}
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
                {loadError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
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
                      onChange={setContent}
                      extensions={[markdown(), EditorView.lineWrapping]}
                      theme={editorTheme}
                      height="240px"
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
                      : t('claudeConfig.saveMemory', { defaultValue: 'Save memory file' })}
                  </Button>
                  <ClaudeConfigSaveStatus status={saveStatus} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('claudeConfig.selectFile', { defaultValue: 'Select a file to view or edit.' })}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

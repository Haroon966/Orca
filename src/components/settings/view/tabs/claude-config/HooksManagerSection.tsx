import { useCallback, useEffect, useMemo, useState } from 'react';
import { json } from '@codemirror/lang-json';
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
import type { HooksScope } from '../../../hooks/useClaudeConfig';
import ClaudeConfigSaveStatus from './ClaudeConfigSaveStatus';

type HooksManagerSectionProps = {
  hooksScopes: HooksScope[];
  onSave: (scope: string, hooks: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function HooksManagerSection({
  hooksScopes,
  onSave,
  disabled = false,
  onDirtyChange,
}: HooksManagerSectionProps) {
  const { t } = useTranslation('settings');
  const editorTheme = useClaudeConfigEditorTheme();
  const [selectedScope, setSelectedScope] = useState(hooksScopes[0]?.scope ?? 'user');
  const [content, setContent] = useState('{}');
  const [savedContent, setSavedContent] = useState('{}');
  const [filePath, setFilePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const isDirty = content !== savedContent;
  useUnsavedChangesReporter(isDirty, onDirtyChange);
  const runGuarded = useGuardedAction(isDirty, t('claudeConfig.unsavedConfirm', {
    defaultValue: 'You have unsaved changes. Discard them?',
  }));

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
      setSavedContent('{}');
      setFilePath('');
      return;
    }

    const serialized = JSON.stringify(selectedEntry.hooks ?? {}, null, 2);
    setContent(serialized);
    setSavedContent(serialized);
    setFilePath(selectedEntry.path);
  }, [selectedEntry]);

  const extensions = useMemo(() => [json(), EditorView.lineWrapping], []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      await onSave(selectedScope, parsed);
      setSavedContent(content);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [content, onSave, selectedScope]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (!saving && !disabled) {
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, handleSave, saving]);

  return (
    <SettingsSection
      title={t('claudeConfig.hooksTitle', { defaultValue: 'Hooks' })}
      description={t('claudeConfig.hooksDescription', {
        defaultValue: 'Edit Claude Code event hooks (PreToolUse, PostToolUse, SessionStart, etc.) in settings.json.',
      })}
    >
      <SettingsCard className="space-y-4 p-4">
        {hooksScopes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('claudeConfig.hooksEmpty', {
              defaultValue: 'No hook scopes found. Default user and project hooks will appear after loading.',
            })}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="tablist">
            {hooksScopes.map((entry) => (
              <Button
                key={entry.scope}
                variant={selectedScope === entry.scope ? 'default' : 'outline'}
                size="sm"
                role="tab"
                aria-selected={selectedScope === entry.scope}
                onClick={() => runGuarded(() => setSelectedScope(entry.scope))}
              >
                {entry.scope}
                {!entry.exists && ` (${t('claudeConfig.newScope', { defaultValue: 'new' })})`}
              </Button>
            ))}
          </div>
        )}

        {filePath && (
          <p className="truncate font-mono text-xs text-muted-foreground">{filePath}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={extensions}
            theme={editorTheme}
            height="240px"
            editable={!disabled}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={saving || disabled || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? t('claudeConfig.saving', { defaultValue: 'Saving…' })
              : t('claudeConfig.saveHooks', { defaultValue: 'Save hooks' })}
          </Button>
          <ClaudeConfigSaveStatus
            status={saveStatus}
            errorKey={saveStatus === 'error' ? 'claudeConfig.hooksSaveFailed' : undefined}
          />
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

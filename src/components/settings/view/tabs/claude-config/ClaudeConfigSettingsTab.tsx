import { useCallback, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Pill, PillBar } from '../../../../../shared/view/ui';
import { useClaudeConfig } from '../../../hooks/useClaudeConfig';
import { confirmDiscardUnsavedChanges } from '../../../hooks/useUnsavedChangesConfirm';
import type { SettingsProject } from '../../../types/types';
import ClaudeMdEditorSection from './ClaudeMdEditorSection';
import HooksManagerSection from './HooksManagerSection';
import MemoryBrowserSection from './MemoryBrowserSection';
import ConfigBrowserSection from './ConfigBrowserSection';

type ClaudeConfigSectionId =
  | 'claudeMd'
  | 'hooks'
  | 'memory'
  | 'skills'
  | 'agents'
  | 'rules';

type ClaudeConfigSettingsTabProps = {
  projects?: SettingsProject[];
  onDirtyChange?: (dirty: boolean) => void;
};

export default function ClaudeConfigSettingsTab({
  projects = [],
  onDirtyChange,
}: ClaudeConfigSettingsTabProps) {
  const { t } = useTranslation('settings');
  const [projectPath, setProjectPath] = useState<string | undefined>(
    () => projects.find((project) => project.fullPath)?.fullPath,
  );
  const [activeSection, setActiveSection] = useState<ClaudeConfigSectionId>('claudeMd');
  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});

  const projectOptions = useMemo(
    () => projects.filter((project) => project.fullPath),
    [projects],
  );

  const {
    claudeMdFiles,
    hooksScopes,
    memoryFiles,
    agents,
    rules,
    skills,
    loading,
    error,
    loadAll,
    readClaudeMd,
    saveClaudeMd,
    saveHooks,
    readMemoryFile,
    saveMemoryFile,
    readAgentFile,
    readConfigFile,
    readRuleFile,
    saveAgentFile,
    saveRuleFile,
    saveConfigFile,
  } = useClaudeConfig(projectPath);

  const isDirty = Object.values(dirtySections).some(Boolean);

  const reportSectionDirty = useCallback((section: string, dirty: boolean) => {
    setDirtySections((previous) => {
      const next = { ...previous, [section]: dirty };
      const anyDirty = Object.values(next).some(Boolean);
      onDirtyChange?.(anyDirty);
      return next;
    });
  }, [onDirtyChange]);

  const guardedSetProjectPath = (nextPath: string | undefined) => {
    if (isDirty && !confirmDiscardUnsavedChanges(t('claudeConfig.unsavedConfirm', {
      defaultValue: 'You have unsaved changes. Discard them?',
    }))) {
      return;
    }
    setProjectPath(nextPath);
  };

  const guardedSetSection = (section: ClaudeConfigSectionId) => {
    if (isDirty && !confirmDiscardUnsavedChanges(t('claudeConfig.unsavedConfirm', {
      defaultValue: 'You have unsaved changes. Discard them?',
    }))) {
      return;
    }
    setActiveSection(section);
  };

  const sectionTabs: { id: ClaudeConfigSectionId; labelKey: string; defaultLabel: string }[] = [
    { id: 'claudeMd', labelKey: 'claudeConfig.sections.claudeMd', defaultLabel: 'CLAUDE.md' },
    { id: 'hooks', labelKey: 'claudeConfig.sections.hooks', defaultLabel: 'Hooks' },
    { id: 'memory', labelKey: 'claudeConfig.sections.memory', defaultLabel: 'Memory' },
    { id: 'skills', labelKey: 'claudeConfig.sections.skills', defaultLabel: 'Skills' },
    { id: 'agents', labelKey: 'claudeConfig.sections.agents', defaultLabel: 'Agents' },
    ...(projectPath
      ? [{ id: 'rules' as const, labelKey: 'claudeConfig.sections.rules', defaultLabel: 'Rules' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t('mainTabs.claudeConfig', { defaultValue: 'Claude Config' })}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('claudeConfig.intro', {
            defaultValue: 'Manage Claude CLI configuration files on disk — the same paths Claude Code reads locally.',
          })}
        </p>
      </div>

      {projectOptions.length > 0 ? (
        <div className="space-y-2">
          <label htmlFor="claude-config-project" className="text-sm font-medium text-foreground">
            {t('claudeConfig.projectLabel', { defaultValue: 'Project context' })}
          </label>
          <select
            id="claude-config-project"
            value={projectPath ?? ''}
            onChange={(event) => guardedSetProjectPath(event.target.value || undefined)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">{t('claudeConfig.globalOnly', { defaultValue: 'Global only (no project)' })}</option>
            {projectOptions.map((project) => (
              <option key={project.name} value={project.fullPath}>
                {project.displayName || project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {t('claudeConfig.projectHelp', {
              defaultValue: 'Project-scoped settings use the selected project directory on disk.',
            })}
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {t('claudeConfig.noProjects', {
            defaultValue: 'No projects with disk paths yet — showing global Claude configuration only.',
          })}
        </p>
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void loadAll()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {t('claudeConfig.retry', { defaultValue: 'Retry' })}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('claudeConfig.loading', { defaultValue: 'Loading Claude configuration…' })}
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm">
        <PillBar>
          {sectionTabs.map((tab) => (
            <Pill
              key={tab.id}
              isActive={activeSection === tab.id}
              onClick={() => guardedSetSection(tab.id)}
            >
              {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
            </Pill>
          ))}
        </PillBar>
      </div>

      {activeSection === 'claudeMd' && (
        <ClaudeMdEditorSection
          projectPath={projectPath}
          claudeMdFiles={claudeMdFiles}
          readClaudeMd={readClaudeMd}
          saveClaudeMd={saveClaudeMd}
          disabled={loading}
          onDirtyChange={(dirty) => reportSectionDirty('claudeMd', dirty)}
        />
      )}

      {activeSection === 'hooks' && (
        <HooksManagerSection
          hooksScopes={hooksScopes}
          onSave={saveHooks}
          disabled={loading}
          onDirtyChange={(dirty) => reportSectionDirty('hooks', dirty)}
        />
      )}

      {activeSection === 'memory' && (
        <MemoryBrowserSection
          files={memoryFiles}
          onRead={readMemoryFile}
          onSave={saveMemoryFile}
          disabled={loading}
          onDirtyChange={(dirty) => reportSectionDirty('memory', dirty)}
        />
      )}

      {activeSection === 'skills' && (
        <ConfigBrowserSection
          title={t('claudeConfig.skillsTitle', { defaultValue: 'Skills' })}
          description={t('claudeConfig.skillsDescription', {
            defaultValue: 'View and edit Claude skills from user, project, and plugin sources.',
          })}
          files={skills}
          emptyMessage={t('claudeConfig.skillsEmpty', { defaultValue: 'No skills found.' })}
          onRead={readConfigFile}
          onSave={saveConfigFile}
          onDirtyChange={(dirty) => reportSectionDirty('skills', dirty)}
        />
      )}

      {activeSection === 'agents' && (
        <ConfigBrowserSection
          title={t('claudeConfig.agentsTitle', { defaultValue: 'Agents' })}
          description={t('claudeConfig.agentsDescription', {
            defaultValue: 'Edit subagent definitions from ~/.claude/agents and project .claude/agents.',
          })}
          files={agents}
          emptyMessage={t('claudeConfig.agentsEmpty', { defaultValue: 'No agent files found.' })}
          onRead={readAgentFile}
          onSave={saveAgentFile}
          onDirtyChange={(dirty) => reportSectionDirty('agents', dirty)}
        />
      )}

      {activeSection === 'rules' && projectPath && (
        <ConfigBrowserSection
          title={t('claudeConfig.rulesTitle', { defaultValue: 'Rules' })}
          description={t('claudeConfig.rulesDescription', {
            defaultValue: 'Edit path-scoped rules from .claude/rules/*.md.',
          })}
          files={rules}
          emptyMessage={t('claudeConfig.rulesEmpty', { defaultValue: 'No rules found for this project.' })}
          onRead={readRuleFile}
          onSave={saveRuleFile}
          onDirtyChange={(dirty) => reportSectionDirty('rules', dirty)}
        />
      )}
    </div>
  );
}

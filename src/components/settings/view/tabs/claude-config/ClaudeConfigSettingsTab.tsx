import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useClaudeConfig } from '../../../hooks/useClaudeConfig';
import type { SettingsProject } from '../../../types/types';
import ClaudeMdEditorSection from './ClaudeMdEditorSection';
import HooksManagerSection from './HooksManagerSection';
import MemoryBrowserSection from './MemoryBrowserSection';
import ConfigBrowserSection from './ConfigBrowserSection';

type ClaudeConfigSettingsTabProps = {
  projects?: SettingsProject[];
};

export default function ClaudeConfigSettingsTab({ projects = [] }: ClaudeConfigSettingsTabProps) {
  const { t } = useTranslation('settings');
  const [projectPath, setProjectPath] = useState<string | undefined>(
    () => projects.find((project) => project.fullPath)?.fullPath,
  );

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
    readClaudeMd,
    saveClaudeMd,
    saveHooks,
    readMemoryFile,
    saveMemoryFile,
    readAgentFile,
    readConfigFile,
    readRuleFile,
  } = useClaudeConfig(projectPath);

  return (
    <div className="space-y-8">
      {projectOptions.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="claude-config-project" className="text-sm font-medium text-foreground">
            {t('claudeConfig.projectLabel', { defaultValue: 'Project context' })}
          </label>
          <select
            id="claude-config-project"
            value={projectPath ?? ''}
            onChange={(event) => setProjectPath(event.target.value || undefined)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">
          {t('claudeConfig.loading', { defaultValue: 'Loading Claude configuration…' })}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <ClaudeMdEditorSection
        projectPath={projectPath}
        claudeMdFiles={claudeMdFiles}
        readClaudeMd={readClaudeMd}
        saveClaudeMd={saveClaudeMd}
      />

      <HooksManagerSection hooksScopes={hooksScopes} onSave={saveHooks} />

      <MemoryBrowserSection
        files={memoryFiles}
        onRead={readMemoryFile}
        onSave={saveMemoryFile}
      />

      <ConfigBrowserSection
        title={t('claudeConfig.skillsTitle', { defaultValue: 'Skills' })}
        description={t('claudeConfig.skillsDescription', {
          defaultValue: 'Read-only view of Claude skills from user, project, and plugin sources.',
        })}
        files={skills}
        emptyMessage={t('claudeConfig.skillsEmpty', { defaultValue: 'No skills found.' })}
        onRead={readConfigFile}
      />

      <ConfigBrowserSection
        title={t('claudeConfig.agentsTitle', { defaultValue: 'Agents' })}
        description={t('claudeConfig.agentsDescription', {
          defaultValue: 'Preview subagent definitions from ~/.claude/agents and project .claude/agents.',
        })}
        files={agents}
        emptyMessage={t('claudeConfig.agentsEmpty', { defaultValue: 'No agent files found.' })}
        onRead={readAgentFile}
      />

      {projectPath && (
        <ConfigBrowserSection
          title={t('claudeConfig.rulesTitle', { defaultValue: 'Rules' })}
          description={t('claudeConfig.rulesDescription', {
            defaultValue: 'Preview path-scoped rules from .claude/rules/*.md.',
          })}
          files={rules}
          emptyMessage={t('claudeConfig.rulesEmpty', { defaultValue: 'No rules found for this project.' })}
          onRead={readRuleFile}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '../../../utils/api';

export type ClaudeMdLevel = 'global' | 'project' | 'local' | 'private';

export type ClaudeMdFile = {
  level: ClaudeMdLevel;
  path: string;
  exists: boolean;
};

export type HooksScope = {
  scope: string;
  path: string;
  hooks: Record<string, unknown>;
  exists: boolean;
};

export type ConfigFileEntry = {
  name: string;
  path: string;
  relativePath: string;
  scope?: string;
  root?: string;
};

export function useClaudeConfig(projectPath?: string) {
  const [claudeMdFiles, setClaudeMdFiles] = useState<ClaudeMdFile[]>([]);
  const [hooksScopes, setHooksScopes] = useState<HooksScope[]>([]);
  const [memoryFiles, setMemoryFiles] = useState<ConfigFileEntry[]>([]);
  const [agents, setAgents] = useState<ConfigFileEntry[]>([]);
  const [rules, setRules] = useState<ConfigFileEntry[]>([]);
  const [skills, setSkills] = useState<ConfigFileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectQuery = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : '';
  const projectAnd = projectPath ? `&projectPath=${encodeURIComponent(projectPath)}` : '';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        claudeMdRes,
        hooksRes,
        memoryRes,
        agentsRes,
        rulesRes,
        skillsRes,
      ] = await Promise.all([
        authenticatedFetch(`/api/claude-config/claude-md${projectQuery}`),
        authenticatedFetch(`/api/claude-config/hooks${projectQuery}`),
        authenticatedFetch('/api/claude-config/memory'),
        authenticatedFetch(`/api/claude-config/agents${projectQuery}`),
        projectPath
          ? authenticatedFetch(`/api/claude-config/rules?projectPath=${encodeURIComponent(projectPath)}`)
          : Promise.resolve(null),
        projectPath
          ? authenticatedFetch(`/api/providers/claude/skills?workspacePath=${encodeURIComponent(projectPath)}`)
          : authenticatedFetch('/api/providers/claude/skills'),
      ]);

      if (claudeMdRes.ok) {
        const data = await claudeMdRes.json();
        setClaudeMdFiles(data.files ?? []);
      }

      if (hooksRes.ok) {
        const data = await hooksRes.json();
        setHooksScopes(data.scopes ?? []);
      }

      if (memoryRes.ok) {
        const data = await memoryRes.json();
        setMemoryFiles(data.files ?? []);
      }

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents ?? []);
      }

      if (rulesRes?.ok) {
        const data = await rulesRes.json();
        setRules(data.rules ?? []);
      } else if (!projectPath) {
        setRules([]);
      }

      if (skillsRes.ok) {
        const data = await skillsRes.json();
        const skillList = data.data?.skills ?? data.skills ?? [];
        setSkills(
          skillList.map((skill: { name: string; sourcePath?: string; scope?: string; command?: string }) => ({
            name: skill.name,
            path: skill.sourcePath ?? skill.command ?? skill.name,
            relativePath: skill.command ?? skill.name,
            scope: skill.scope,
          })),
        );
      }
    } catch (loadError) {
      console.error('Failed to load Claude config:', loadError);
      setError('Failed to load Claude configuration');
    } finally {
      setLoading(false);
    }
  }, [projectPath, projectQuery]);

  const readClaudeMd = useCallback(async (level: ClaudeMdLevel) => {
    const response = await authenticatedFetch(
      `/api/claude-config/claude-md/${level}${projectQuery}`,
    );
    if (!response.ok) {
      throw new Error('Failed to read CLAUDE.md');
    }
    return response.json() as Promise<{ content: string; path: string }>;
  }, [projectQuery]);

  const saveClaudeMd = useCallback(async (level: ClaudeMdLevel, content: string) => {
    const response = await authenticatedFetch(`/api/claude-config/claude-md/${level}`, {
      method: 'PUT',
      body: JSON.stringify({ content, projectPath }),
    });
    if (!response.ok) {
      throw new Error('Failed to save CLAUDE.md');
    }
    await loadAll();
  }, [loadAll, projectPath]);

  const saveHooks = useCallback(async (scope: string, hooks: Record<string, unknown>) => {
    const response = await authenticatedFetch('/api/claude-config/hooks', {
      method: 'PUT',
      body: JSON.stringify({ scope, hooks, projectPath }),
    });
    if (!response.ok) {
      throw new Error('Failed to save hooks');
    }
    await loadAll();
  }, [loadAll, projectPath]);

  const readMemoryFile = useCallback(async (filePath: string) => {
    const response = await authenticatedFetch(
      `/api/claude-config/memory/file?filePath=${encodeURIComponent(filePath)}`,
    );
    if (!response.ok) {
      throw new Error('Failed to read memory file');
    }
    return response.json() as Promise<{ content: string; path: string }>;
  }, []);

  const saveMemoryFile = useCallback(async (filePath: string, content: string) => {
    const response = await authenticatedFetch('/api/claude-config/memory/file', {
      method: 'PUT',
      body: JSON.stringify({ filePath, content }),
    });
    if (!response.ok) {
      throw new Error('Failed to save memory file');
    }
  }, []);

  const readAgentFile = useCallback(async (filePath: string) => {
    const response = await authenticatedFetch(
      `/api/claude-config/agents/file?filePath=${encodeURIComponent(filePath)}${projectAnd}`,
    );
    if (!response.ok) {
      throw new Error('Failed to read agent file');
    }
    return response.json() as Promise<{ content: string; path: string }>;
  }, [projectAnd]);

  const readConfigFile = useCallback(async (filePath: string) => {
    const response = await authenticatedFetch(
      `/api/claude-config/file?filePath=${encodeURIComponent(filePath)}${projectAnd}`,
    );
    if (!response.ok) {
      throw new Error('Failed to read config file');
    }
    return response.json() as Promise<{ content: string; path: string }>;
  }, [projectAnd]);

  const readRuleFile = useCallback(async (filePath: string) => {
    if (!projectPath) {
      throw new Error('Project path is required');
    }
    const response = await authenticatedFetch(
      `/api/claude-config/rules/file?filePath=${encodeURIComponent(filePath)}&projectPath=${encodeURIComponent(projectPath)}`,
    );
    if (!response.ok) {
      throw new Error('Failed to read rule file');
    }
    return response.json() as Promise<{ content: string; path: string }>;
  }, [projectPath]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return {
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
  };
}

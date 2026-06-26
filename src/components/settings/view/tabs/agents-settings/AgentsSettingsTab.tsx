import { useEffect, useMemo, useState } from 'react';

import { ORCA_ENABLED_PROVIDERS } from '../../../../../config/orca';
import type { AgentCategory, AgentProvider } from '../../../types/types';

import type { AgentContext, AgentsSettingsTabProps } from './types';
import AgentCategoryContentSection from './sections/AgentCategoryContentSection';
import AgentCategoryTabsSection from './sections/AgentCategoryTabsSection';

export default function AgentsSettingsTab({
  providerAuthStatus,
  onProviderLogin,
  claudePermissions,
  onClaudePermissionsChange,
  cursorPermissions,
  onCursorPermissionsChange,
  codexPermissionMode,
  onCodexPermissionModeChange,
  geminiPermissionMode,
  onGeminiPermissionModeChange,
  projects,
}: AgentsSettingsTabProps) {
  const selectedAgent: AgentProvider = 'claude';
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>('account');

  const visibleCategories = useMemo<AgentCategory[]>(
    () => ['account', 'permissions', 'mcp', 'skills'],
    [],
  );

  const agentContextById = useMemo<Record<AgentProvider, AgentContext>>(
    () => ({
      claude: {
        authStatus: providerAuthStatus.claude,
        onLogin: () => onProviderLogin('claude'),
      },
      cursor: {
        authStatus: providerAuthStatus.cursor,
        onLogin: () => onProviderLogin('cursor'),
      },
      codex: {
        authStatus: providerAuthStatus.codex,
        onLogin: () => onProviderLogin('codex'),
      },
      gemini: {
        authStatus: providerAuthStatus.gemini,
        onLogin: () => onProviderLogin('gemini'),
      },
      opencode: {
        authStatus: providerAuthStatus.opencode,
        onLogin: () => onProviderLogin('opencode'),
      },
    }),
    [onProviderLogin, providerAuthStatus.claude],
  );

  useEffect(() => {
    if (!visibleCategories.includes(selectedCategory)) {
      setSelectedCategory(visibleCategories[0] ?? 'account');
    }
  }, [selectedCategory, visibleCategories]);

  const showAgentSelector = ORCA_ENABLED_PROVIDERS.length > 1;

  return (
    <div className="-mx-4 -mb-4 -mt-2 flex min-h-[300px] min-w-0 flex-col overflow-hidden md:-mx-6 md:-mb-6 md:-mt-2 md:min-h-[500px]">
      {!showAgentSelector && (
        <div className="border-b border-border px-4 py-3 md:px-6">
          <h3 className="text-sm font-medium text-foreground">Claude Code</h3>
          <p className="text-xs text-muted-foreground">
            Account, permissions, MCP servers, and skills for Claude CLI.
          </p>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgentCategoryTabsSection
          categories={visibleCategories}
          selectedAgent={selectedAgent}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <AgentCategoryContentSection
          selectedAgent={selectedAgent}
          selectedCategory={selectedCategory}
          agentContextById={agentContextById}
          claudePermissions={claudePermissions}
          onClaudePermissionsChange={onClaudePermissionsChange}
          cursorPermissions={cursorPermissions}
          onCursorPermissionsChange={onCursorPermissionsChange}
          codexPermissionMode={codexPermissionMode}
          onCodexPermissionModeChange={onCodexPermissionModeChange}
          geminiPermissionMode={geminiPermissionMode}
          onGeminiPermissionModeChange={onGeminiPermissionModeChange}
          projects={projects}
        />
      </div>
    </div>
  );
}

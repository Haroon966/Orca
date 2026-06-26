import type { ProviderAuthStatus } from '../../../provider-auth/types';

import AgentConnectionCard from './AgentConnectionCard';

type AgentConnectionsStepProps = {
  claudeStatus: ProviderAuthStatus;
  onOpenClaudeLogin: () => void;
};

export default function AgentConnectionsStep({
  claudeStatus,
  onOpenClaudeLogin,
}: AgentConnectionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Connect Claude Code</h2>
        <p className="text-muted-foreground">
          Sign in with your Anthropic account so Claude CLI can run sessions from this app.
        </p>
      </div>

      <div className="space-y-3">
        <AgentConnectionCard
          provider="claude"
          title="Claude Code"
          status={claudeStatus}
          connectedClassName="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
          loginButtonClassName="bg-blue-600 hover:bg-blue-700"
          onLogin={onOpenClaudeLogin}
        />
      </div>

      <div className="space-y-2 pt-2 text-center text-sm text-muted-foreground">
        <p>
          You can also run{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">claude login</code>{' '}
          in the Shell tab.
        </p>
        <p>Configure Claude later in Settings → Agents.</p>
      </div>
    </div>
  );
}

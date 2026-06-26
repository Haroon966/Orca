import type { LLMProvider } from '../../types/app';
import { ORCA_ENABLED_PROVIDERS } from '../../config/orca';

export type ProviderAuthStatus = {
  authenticated: boolean;
  email: string | null;
  method: string | null;
  error: string | null;
  loading: boolean;
};

export type ClaudeProviderAuthStatus = ProviderAuthStatus;

export type ProviderAuthStatusMap = Record<LLMProvider, ProviderAuthStatus>;

export const CLI_PROVIDERS: LLMProvider[] = ORCA_ENABLED_PROVIDERS;

export const CLAUDE_AUTH_STATUS_ENDPOINT = '/api/providers/claude/auth/status';

export const PROVIDER_AUTH_STATUS_ENDPOINTS: Record<LLMProvider, string> = {
  claude: CLAUDE_AUTH_STATUS_ENDPOINT,
  cursor: '/api/providers/cursor/auth/status',
  codex: '/api/providers/codex/auth/status',
  gemini: '/api/providers/gemini/auth/status',
  opencode: '/api/providers/opencode/auth/status',
};

const emptyStatus = (loading: boolean): ProviderAuthStatus => ({
  authenticated: false,
  email: null,
  method: null,
  error: null,
  loading,
});

export const createInitialProviderAuthStatusMap = (loading = true): ProviderAuthStatusMap => ({
  claude: emptyStatus(loading),
  cursor: emptyStatus(false),
  codex: emptyStatus(false),
  gemini: emptyStatus(false),
  opencode: emptyStatus(false),
});

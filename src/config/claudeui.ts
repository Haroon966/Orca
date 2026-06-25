import type { LLMProvider } from '../types/app';

/** ClaudeUI is focused on Claude Code CLI. Set to false to show all upstream providers. */
export const CLAUDEUI_CLAUDE_ONLY = true;

export const CLAUDEUI_ENABLED_PROVIDERS: LLMProvider[] = CLAUDEUI_CLAUDE_ONLY
  ? ['claude']
  : ['claude', 'cursor', 'codex', 'gemini', 'opencode'];

export const CLAUDEUI_PRODUCT_NAME = 'ClaudeUI';

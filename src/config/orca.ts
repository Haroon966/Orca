import type { LLMProvider } from '../types/app';

export const ORCA_PRODUCT_NAME = 'Orca';
export const ORCA_TAGLINE = 'Intelligent coding interface';
export const ORCA_NPM_PACKAGE = '@orca-ai/orca';
export const ORCA_CLI_BIN = 'orca';
export const ORCA_DATA_DIR = '.orca';
export const ORCA_DEFAULT_COLOR_THEME = 'orca';

export const ORCA_GITHUB = {
  owner: import.meta.env.VITE_GITHUB_OWNER ?? 'Haroon966',
  repo: import.meta.env.VITE_GITHUB_REPO ?? 'Orca',
};

export const ORCA_GITHUB_URL = `https://github.com/${ORCA_GITHUB.owner}/${ORCA_GITHUB.repo}`;

/** Orca is focused on Claude Code CLI. Set to false to show all upstream providers. */
export const ORCA_CLAUDE_ONLY = true;

export const ORCA_ENABLED_PROVIDERS: LLMProvider[] = ORCA_CLAUDE_ONLY
  ? ['claude']
  : ['claude', 'cursor', 'codex', 'gemini', 'opencode'];

export type ColorThemeId = 'orca' | 'classic' | 'slate' | 'custom';

export type CustomThemeColorKey =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'card'
  | 'border'
  | 'muted';

export type CustomThemeColors = Record<CustomThemeColorKey, string>;

export type CustomPalette = {
  light: CustomThemeColors;
  dark: CustomThemeColors;
};

export const CUSTOM_THEME_COLOR_KEYS: CustomThemeColorKey[] = [
  'background',
  'foreground',
  'primary',
  'card',
  'border',
  'muted',
];

export const DEFAULT_CUSTOM_PALETTE: CustomPalette = {
  light: {
    background: '#F0F8FF',
    foreground: '#000814',
    primary: '#0077B6',
    card: '#FFFFFF',
    border: '#D4E8EF',
    muted: '#E8F4F7',
  },
  dark: {
    background: '#000814',
    foreground: '#CAF0F8',
    primary: '#0BA5E9',
    card: '#041220',
    border: '#1B2D3D',
    muted: '#12202C',
  },
};

export const COLOR_SWATCHES: Record<CustomThemeColorKey, string[]> = {
  background: ['#FFFFFF', '#F8FAFC', '#F0F8FF', '#F5F5F4', '#FAF5FF', '#FFF7ED', '#000814', '#0F172A'],
  foreground: ['#000814', '#0F172A', '#1E293B', '#334155', '#FFFFFF', '#F8FAFC', '#CAF0F8', '#E2E8F0'],
  primary: ['#0077B6', '#0BA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#22C55E'],
  card: ['#FFFFFF', '#F8FAFC', '#F0F8FF', '#041220', '#0F172A', '#1E293B', '#18181B', '#27272A'],
  border: ['#E2E8F0', '#D4E8EF', '#CBD5E1', '#94A3B8', '#1B2D3D', '#334155', '#3F3F46', '#52525B'],
  muted: ['#F1F5F9', '#E8F4F7', '#E2E8F0', '#F4F4F5', '#12202C', '#1E293B', '#27272A', '#3F3F46'],
};

export const PRESET_COLOR_THEMES: { id: Exclude<ColorThemeId, 'custom'>; labelKey: string; gradient: string }[] = [
  {
    id: 'orca',
    labelKey: 'appearanceSettings.colorTheme.orca',
    gradient: 'linear-gradient(180deg, #000814 0%, #0077b6 50%, #caf0f8 100%)',
  },
  {
    id: 'classic',
    labelKey: 'appearanceSettings.colorTheme.classic',
    gradient: 'linear-gradient(180deg, #1e3a5f 0%, #3b82f6 50%, #dbeafe 100%)',
  },
  {
    id: 'slate',
    labelKey: 'appearanceSettings.colorTheme.slate',
    gradient: 'linear-gradient(180deg, #0f172a 0%, #64748b 50%, #e2e8f0 100%)',
  },
];

/** @deprecated Use PRESET_COLOR_THEMES */
export const COLOR_THEMES = PRESET_COLOR_THEMES;

export const ORCA_THEME_COLORS = {
  light: '#F0F8FF',
  dark: '#000814',
} as const;

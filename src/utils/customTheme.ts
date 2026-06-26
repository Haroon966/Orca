import type { CustomPalette, CustomThemeColors } from '../config/orca';

export const CUSTOM_THEME_CSS_VARS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'nav-glass-bg',
  'nav-tab-glow',
  'nav-tab-ring',
  'nav-float-shadow',
  'nav-float-ring',
  'nav-divider-color',
  'nav-input-bg',
  'nav-input-focus-ring',
] as const;

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    return null;
  }

  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return trimmed.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }

  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function hexToHslTriplet(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    hue = ((b - r) / delta + 2) * 60;
  } else {
    hue = ((r - g) / delta + 4) * 60;
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getReadableForeground(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.45 ? '#000814' : '#FFFFFF';
}

function mixHex(baseHex: string, targetHex: string, amount: number): string {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  if (!base || !target) {
    return baseHex;
  }

  const mix = (from: number, to: number) =>
    Math.round(from + (to - from) * amount);

  const r = mix(base.r, target.r).toString(16).padStart(2, '0');
  const g = mix(base.g, target.g).toString(16).padStart(2, '0');
  const b = mix(base.b, target.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

function withAlpha(triplet: string, alpha: number): string {
  return `${triplet} / ${alpha}`;
}

function toVar(hex: string): string {
  return hexToHslTriplet(hex) ?? '0 0% 50%';
}

export function deriveThemeVariables(
  colors: CustomThemeColors,
  isDark: boolean,
): Record<string, string> {
  const primaryForeground = getReadableForeground(colors.primary);
  const secondary = mixHex(colors.background, colors.primary, isDark ? 0.35 : 0.12);
  const accent = mixHex(colors.background, colors.primary, isDark ? 0.5 : 0.2);
  const mutedForeground = mixHex(colors.foreground, colors.muted, 0.45);
  const secondaryForeground = mixHex(colors.foreground, colors.primary, 0.25);
  const accentForeground = mixHex(colors.foreground, colors.primary, 0.35);
  const destructive = isDark ? '#7F1D1D' : '#EF4444';
  const destructiveForeground = getReadableForeground(destructive);

  const background = toVar(colors.background);
  const foreground = toVar(colors.foreground);
  const card = toVar(colors.card);
  const primary = toVar(colors.primary);
  const border = toVar(colors.border);
  const muted = toVar(colors.muted);

  return {
    background,
    foreground,
    card,
    'card-foreground': foreground,
    popover: card,
    'popover-foreground': foreground,
    primary,
    'primary-foreground': toVar(primaryForeground),
    secondary: toVar(secondary),
    'secondary-foreground': toVar(secondaryForeground),
    muted,
    'muted-foreground': toVar(mutedForeground),
    accent: toVar(accent),
    'accent-foreground': toVar(accentForeground),
    destructive: toVar(destructive),
    'destructive-foreground': toVar(destructiveForeground),
    border,
    input: border,
    ring: primary,
    'nav-glass-bg': withAlpha(card, isDark ? 0.55 : 0.7),
    'nav-tab-glow': withAlpha(primary, isDark ? 0.25 : 0.18),
    'nav-tab-ring': withAlpha(primary, isDark ? 0.15 : 0.1),
    'nav-float-shadow': isDark ? '0 0% 0% / 0.35' : withAlpha(colors.foreground, 0.06),
    'nav-float-ring': withAlpha(border, isDark ? 0.3 : 0.5),
    'nav-divider-color': withAlpha(border, 0.5),
    'nav-input-bg': withAlpha(muted, 0.5),
    'nav-input-focus-ring': withAlpha(primary, isDark ? 0.25 : 0.22),
  };
}

export function applyCustomTheme(palette: CustomPalette, isDark: boolean): void {
  const colors = isDark ? palette.dark : palette.light;
  const variables = deriveThemeVariables(colors, isDark);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export function clearCustomThemeOverrides(): void {
  const root = document.documentElement;
  for (const key of CUSTOM_THEME_CSS_VARS) {
    root.style.removeProperty(`--${key}`);
  }
}

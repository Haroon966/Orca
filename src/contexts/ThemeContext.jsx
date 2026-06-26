import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ORCA_DEFAULT_COLOR_THEME,
  ORCA_THEME_COLORS,
  DEFAULT_CUSTOM_PALETTE,
} from '../config/orca';
import { applyCustomTheme, clearCustomThemeOverrides, normalizeHex } from '../utils/customTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const VALID_COLOR_THEMES = new Set(['orca', 'classic', 'slate', 'custom']);

function readInitialColorTheme() {
  const saved = localStorage.getItem('colorTheme');
  if (saved && VALID_COLOR_THEMES.has(saved)) {
    return saved;
  }
  return ORCA_DEFAULT_COLOR_THEME;
}

function readInitialCustomPalette() {
  const saved = localStorage.getItem('customPalette');
  if (!saved) {
    return DEFAULT_CUSTOM_PALETTE;
  }

  try {
    const parsed = JSON.parse(saved);
    if (parsed?.light && parsed?.dark) {
      return parsed;
    }
  } catch {
    // fall through to default
  }

  return DEFAULT_CUSTOM_PALETTE;
}

function applyThemeMeta(isDarkMode) {
  const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (statusBarMeta) {
    statusBarMeta.setAttribute('content', isDarkMode ? 'black-translucent' : 'default');
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDarkMode ? ORCA_THEME_COLORS.dark : ORCA_THEME_COLORS.light);
  }
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  });

  const [colorTheme, setColorThemeState] = useState(readInitialColorTheme);
  const [customPalette, setCustomPaletteState] = useState(readInitialCustomPalette);

  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme;
    localStorage.setItem('colorTheme', colorTheme);

    if (colorTheme === 'custom') {
      applyCustomTheme(customPalette, isDarkMode);
    } else {
      clearCustomThemeOverrides();
    }
  }, [colorTheme, customPalette, isDarkMode]);

  useEffect(() => {
    localStorage.setItem('customPalette', JSON.stringify(customPalette));
  }, [customPalette]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    applyThemeMeta(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const setColorTheme = useCallback((themeId) => {
    if (!VALID_COLOR_THEMES.has(themeId)) {
      return;
    }

    if (themeId !== 'custom') {
      clearCustomThemeOverrides();
    }

    setColorThemeState(themeId);
  }, []);

  const setCustomPalette = useCallback((palette) => {
    setCustomPaletteState(palette);
    setColorThemeState('custom');
  }, []);

  const setCustomColor = useCallback((mode, key, hex) => {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return;
    }

    setCustomPaletteState((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: normalized,
      },
    }));
    setColorThemeState('custom');
  }, []);

  const resetCustomPalette = useCallback(() => {
    setCustomPaletteState(DEFAULT_CUSTOM_PALETTE);
    setColorThemeState('custom');
  }, []);

  const value = {
    isDarkMode,
    toggleDarkMode,
    colorTheme,
    setColorTheme,
    customPalette,
    setCustomPalette,
    setCustomColor,
    resetCustomPalette,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

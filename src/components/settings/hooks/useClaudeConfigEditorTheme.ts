import { useCallback, useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';

import {
  CODE_EDITOR_DEFAULTS,
  CODE_EDITOR_SETTINGS_CHANGED_EVENT,
  CODE_EDITOR_STORAGE_KEYS,
} from '../../code-editor/constants/settings';

export function useClaudeConfigEditorTheme() {
  const readIsDark = useCallback(() => {
    const saved = localStorage.getItem(CODE_EDITOR_STORAGE_KEYS.theme);
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return CODE_EDITOR_DEFAULTS.isDarkMode;
  }, []);

  const [isDark, setIsDark] = useState(readIsDark);

  useEffect(() => {
    const handleChange = () => setIsDark(readIsDark());
    window.addEventListener(CODE_EDITOR_SETTINGS_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(CODE_EDITOR_SETTINGS_CHANGED_EVENT, handleChange);
  }, [readIsDark]);

  return isDark ? oneDark : undefined;
}

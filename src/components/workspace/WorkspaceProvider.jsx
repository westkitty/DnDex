import React, { useEffect, useMemo, useState } from 'react';
import { WorkspaceContext } from './workspaceContext';

const THEMES = ['dragon-glass', 'simple-utility', 'sketchbook', 'terminal', 'starfleet'];
const MODES = ['combat', 'prep'];
const STORAGE_KEY = 'dndex-workspace-preferences-v1';

const readPrefs = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      theme: THEMES.includes(parsed.theme) ? parsed.theme : 'dragon-glass',
      mode: MODES.includes(parsed.mode) ? parsed.mode : 'combat',
      layoutLocked: Boolean(parsed.layoutLocked)
    };
  } catch {
    return null;
  }
};

export const WorkspaceProvider = ({ children }) => {
  const initial = readPrefs();
  const [theme, setTheme] = useState(initial?.theme || 'dragon-glass');
  const [mode, setMode] = useState(initial?.mode || 'combat');
  const [layoutLocked, setLayoutLocked] = useState(initial?.layoutLocked || false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({ theme, mode, layoutLocked });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [theme, mode, layoutLocked]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    mode,
    setMode,
    layoutLocked,
    setLayoutLocked,
    availableThemes: THEMES
  }), [theme, mode, layoutLocked]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

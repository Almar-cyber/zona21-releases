import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'zona21-theme';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch { /* ignore */ }
  return 'system';
}

function resolveTheme(theme: Theme, systemIsDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemIsDark ? 'dark' : 'light';
  return theme;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemIsDark, setSystemIsDark] = useState(true);

  // Detect system preference on mount
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.getNativeTheme) {
      api.getNativeTheme().then((isDark: boolean) => setSystemIsDark(isDark));
    } else {
      // Fallback: CSS media query
      setSystemIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.onNativeThemeChange) {
      const unsubscribe = api.onNativeThemeChange((isDark: boolean) => {
        setSystemIsDark(isDark);
      });
      return () => { unsubscribe?.(); };
    } else {
      // Fallback: matchMedia listener
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const resolved = resolveTheme(theme, systemIsDark);

  // Apply data-theme attribute whenever resolved theme changes
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch { /* ignore */ }
    // Sync Electron native theme for native dialogs
    const api = (window as any).electronAPI;
    if (api?.setNativeTheme) {
      api.setNativeTheme(newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

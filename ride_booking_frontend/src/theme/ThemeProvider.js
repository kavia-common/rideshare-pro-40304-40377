import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext({ theme: 'light', toggle: () => {} });

/**
 * PUBLIC_INTERFACE
 * ThemeProvider provides light/dark theme state and applies it to the document element.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useTheme returns the theme and a toggle function.
 */
export function useTheme() {
  return useContext(ThemeCtx);
}

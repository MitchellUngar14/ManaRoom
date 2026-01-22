'use client';

import { useState, useEffect, useCallback } from 'react';
import { BattlefieldTheme, getTheme, defaultTheme, themeToCSSVariables } from '@/lib/themes';

const THEME_STORAGE_KEY = 'manaroom-battlefield-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<BattlefieldTheme>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      const savedTheme = getTheme(savedThemeId);
      setThemeState(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (!isLoaded) return;

    const cssVariables = themeToCSSVariables(theme);
    const root = document.documentElement;

    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Also set a data attribute for potential CSS selector usage
    root.setAttribute('data-theme', theme.id);
  }, [theme, isLoaded]);

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getTheme(themeId);
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, []);

  return {
    theme,
    setTheme,
    isLoaded,
  };
}

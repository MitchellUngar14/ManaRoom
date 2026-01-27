'use client';

import { useState, useEffect, useCallback } from 'react';
import { BattlefieldTheme, getTheme, defaultTheme, themeToCSSVariables } from '@/lib/themes';

const THEME_STORAGE_KEY = 'manaroom-battlefield-theme';
const THEME_CHANGE_EVENT = 'manaroom-theme-change';

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

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent<string>) => {
      const newTheme = getTheme(event.detail);
      setThemeState(newTheme);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    };
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

    // Dispatch event to notify other useTheme instances
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: themeId }));
  }, []);

  return {
    theme,
    setTheme,
    isLoaded,
  };
}

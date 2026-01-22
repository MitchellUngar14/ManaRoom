'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { themeList, BattlefieldTheme } from '@/lib/themes';

interface ThemeSelectorProps {
  currentTheme: BattlefieldTheme;
  onThemeChange: (themeId: string) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (themeId: string) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800/80 hover:bg-gray-700/80 rounded-lg border border-gray-700 transition-colors"
        title="Change battlefield theme"
      >
        {/* Color swatch preview */}
        <div className="flex gap-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentTheme.colors.bgPrimary }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentTheme.colors.accent }}
          />
        </div>
        <span className="text-gray-300">{currentTheme.name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 py-2 min-w-[240px] z-[9999] max-h-[400px] overflow-y-auto"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800 mb-1">
              Battlefield Theme
            </div>
            {themeList.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-800/80 transition-colors ${
                  theme.id === currentTheme.id ? 'bg-gray-800/60' : ''
                }`}
              >
                {/* Theme color preview */}
                <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden border border-gray-700">
                  <div
                    className="w-full h-full relative"
                    style={{ backgroundColor: theme.colors.bgPrimary }}
                  >
                    {/* Accent stripe */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    {/* Ambient indicator */}
                    {theme.effects.ambientEnabled && (
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: theme.effects.ambientColor }}
                      />
                    )}
                  </div>
                </div>

                {/* Theme info */}
                <div className="flex-1 text-left">
                  <div className="text-sm text-gray-200 flex items-center gap-2">
                    {theme.name}
                    {theme.id === currentTheme.id && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{theme.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

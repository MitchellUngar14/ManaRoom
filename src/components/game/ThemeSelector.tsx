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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position dropdown below button, aligned to left edge
      // But ensure it doesn't go off the right side of the screen
      const menuWidth = 240; // min-w-[240px]
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - 16) {
        left = window.innerWidth - menuWidth - 16;
      }
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, left), // Ensure at least 8px from left edge
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
        className="group relative cursor-pointer transition-all duration-200 hover:brightness-110 active:brightness-90"
        title="Change battlefield theme"
        style={{
          width: '140px',
          height: '36px',
        }}
      >
        {/* Button frame background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/DropDownButton.png)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
          }}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center px-2">
          {/* Left side - stacked color boxes with glow effect */}
          <div className="flex flex-col gap-1 ml-1 mt-px">
            <div
              className="w-4 h-2 rounded-sm"
              style={{
                backgroundColor: currentTheme.colors.bgPrimary,
                boxShadow: `0 0 6px ${currentTheme.colors.bgPrimary}, 0 0 12px ${currentTheme.colors.bgPrimary}, 0 0 18px ${currentTheme.colors.bgPrimary}, inset 0 0 4px rgba(255,255,255,0.3)`,
              }}
            />
            <div
              className="w-4 h-2 rounded-sm"
              style={{
                backgroundColor: currentTheme.colors.accent,
                boxShadow: `0 0 6px ${currentTheme.colors.accent}, 0 0 12px ${currentTheme.colors.accent}, 0 0 18px ${currentTheme.colors.accent}, inset 0 0 4px rgba(255,255,255,0.3)`,
              }}
            />
          </div>

          {/* Right side - centered theme name */}
          <div className="flex-1 flex items-center justify-center pr-2">
            <span
              className="text-xs font-bold"
              style={{
                color: 'var(--theme-accent)',
                textShadow: '0 0 8px var(--theme-accent-glow)',
              }}
            >
              {currentTheme.name}
            </span>
          </div>
        </div>
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
              left: menuPosition.left,
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

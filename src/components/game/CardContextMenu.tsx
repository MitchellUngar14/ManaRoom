'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuOption {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface CardContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  options: MenuOption[];
  onClose: () => void;
}

export function CardContextMenu({
  isOpen,
  position,
  options,
  onClose,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu on screen
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined') {
    const menuWidth = 160;
    const menuHeight = options.length * 36 + 8;

    if (position.x + menuWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - menuWidth - 8;
    }
    if (position.y + menuHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - menuHeight - 8;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 bg-gray-800 rounded-lg shadow-xl py-1 min-w-[160px] border border-gray-700"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                option.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

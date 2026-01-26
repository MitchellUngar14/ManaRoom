'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface BattlefieldMenuOption {
  label: string;
  icon: 'focus' | 'unfocus' | 'popout';
  onClick: () => void;
}

interface BattlefieldContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  options: BattlefieldMenuOption[];
  onClose: () => void;
}

function FocusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function UnfocusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function PopoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

const iconMap: Record<BattlefieldMenuOption['icon'], React.FC> = {
  focus: FocusIcon,
  unfocus: UnfocusIcon,
  popout: PopoutIcon,
};

export function BattlefieldContextMenu({
  isOpen,
  position,
  options,
  onClose,
}: BattlefieldContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.button === 0 && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleContextMenuOutside = (event: MouseEvent) => {
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
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('contextmenu', handleContextMenuOutside);
        document.addEventListener('keydown', handleEscape);
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleContextMenuOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Calculate radial positions for each option
  const radius = 60;
  const getItemPosition = (index: number, total: number) => {
    const startAngle = -90;
    const spreadAngle = Math.min(180, total * 45);
    const angleStep = total > 1 ? spreadAngle / (total - 1) : 0;
    const angle = startAngle - spreadAngle / 2 + angleStep * index;
    const radians = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  // Adjust position to keep menu on screen
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined') {
    const padding = radius + 30;

    if (position.x - padding < 0) {
      adjustedPosition.x = padding;
    } else if (position.x + padding > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - padding;
    }

    if (position.y - padding < 0) {
      adjustedPosition.y = padding;
    } else if (position.y + padding > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - padding;
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          className="fixed"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            zIndex: 9999,
          }}
        >
          {/* Center dot */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.05 }}
            className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: 'var(--theme-border)' }}
          />

          {/* Radial menu items */}
          {options.map((option, index) => {
            const pos = getItemPosition(index, options.length);
            const IconComponent = iconMap[option.icon];

            return (
              <motion.button
                key={index}
                initial={{ scale: 0.5, x: pos.x * 0.3, y: pos.y * 0.3, opacity: 0 }}
                animate={{
                  scale: 1,
                  x: pos.x,
                  y: pos.y,
                  opacity: 1
                }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{
                  duration: 0.12,
                  ease: 'easeOut'
                }}
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                className="absolute w-11 h-11 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all shadow-lg group"
                style={{
                  backgroundColor: 'var(--theme-bg-elevated)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--theme-accent-muted)';
                  e.currentTarget.style.color = 'var(--theme-accent)';
                  e.currentTarget.style.boxShadow = '0 0 16px var(--theme-accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-bg-elevated)';
                  e.currentTarget.style.borderColor = 'var(--theme-border)';
                  e.currentTarget.style.color = 'var(--theme-text-secondary)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                title={option.label}
              >
                <IconComponent />

                {/* Tooltip */}
                <span
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary)',
                    color: 'var(--theme-text-secondary)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { FancyButton } from './FancyButton';

// Keyboard shortcuts data
const KEYBOARD_SHORTCUTS = [
  { key: 'D', description: 'Draw a card' },
  { key: 'G', description: 'Send hovered card to graveyard' },
  { key: 'L', description: 'View library (search cards)' },
  { key: 'P', description: 'Preview hovered card' },
  { key: 'T', description: 'Tap/Untap hovered card' },
  { key: 'E', description: 'Edit hovered card (counters, P/T)' },
  { key: 'S', description: 'Shuffle library' },
  { key: 'O', description: 'Order cards on battlefield' },
  { key: 'U', description: 'Untap all your cards' },
  { key: '+', description: 'Increase your life' },
  { key: '-', description: 'Decrease your life' },
  { key: 'Esc', description: 'Cancel attach mode / Close preview' },
  { key: 'Ctrl', description: 'Toggle bottom bar visibility' },
];

export function GameControls() {
  const router = useRouter();
  const { restart, roomKey } = useGameStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopyRoomKey = () => {
    if (roomKey) {
      navigator.clipboard.writeText(roomKey);
    }
    setShowMenu(false);
  };

  const handleRestart = () => {
    setShowMenu(false);
    // Use setTimeout to ensure menu closes before confirm dialog
    setTimeout(() => {
      if (confirm('Are you sure you want to restart the game? This will reset all players.')) {
        restart();
      }
    }, 0);
  };

  const handleBackToLobby = () => {
    setShowMenu(false);
    setTimeout(() => {
      if (confirm('Are you sure you want to leave the game and return to the lobby?')) {
        router.push('/lobby');
      }
    }, 0);
  };

  const handleShowShortcuts = () => {
    setShowMenu(false);
    setShowShortcuts(true);
  };

  const handleMenuToggle = () => {
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setShowMenu(!showMenu);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking the menu button or inside the menu
      if (menuButtonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setShowMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <>
      <div className="flex items-center gap-2">
        <div ref={menuButtonRef} className="flex items-center">
          <FancyButton
            onClick={handleMenuToggle}
            cutoutImage="/MenuCutout.png"
            title="Game menu"
          />
        </div>

        {showMenu && createPortal(
          <div
            ref={menuRef}
            className="fixed bg-gray-800 rounded-lg shadow-lg py-1 min-w-[160px] z-[9999]"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            <button
              onClick={handleCopyRoomKey}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white"
            >
              Copy Room Code
            </button>
            <button
              onClick={handleBackToLobby}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white"
            >
              Back to Lobby
            </button>
            <div className="border-t border-gray-700 my-1" />
            <button
              onClick={handleShowShortcuts}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white"
            >
              Keyboard Shortcuts
            </button>
            <div className="border-t border-gray-700 my-1" />
            <button
              onClick={handleRestart}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400"
            >
              Restart Game
            </button>
          </div>,
          document.body
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono text-white min-w-[32px] text-center">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

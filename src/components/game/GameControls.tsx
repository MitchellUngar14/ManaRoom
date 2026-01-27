'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { TokenSearch } from './TokenSearch';
import { FancyButton } from './FancyButton';

export function GameControls() {
  const router = useRouter();
  const { shuffle, restart, roomKey } = useGameStore();
  const [showTokenSearch, setShowTokenSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
        <FancyButton
          onClick={shuffle}
          cutoutImage="/ShuffleCutout.png"
          title="Shuffle library"
        />

        <FancyButton
          onClick={() => setShowTokenSearch(true)}
          cutoutImage="/TokensCutout.png"
          title="Search for tokens"
        />

        <div ref={menuButtonRef}>
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
              onClick={handleRestart}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400"
            >
              Restart Game
            </button>
          </div>,
          document.body
        )}
      </div>

      {showTokenSearch && (
        <TokenSearch onClose={() => setShowTokenSearch(false)} />
      )}
    </>
  );
}

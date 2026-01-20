'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TokenSearch } from './TokenSearch';

export function GameControls() {
  const { shuffle, restart, roomKey } = useGameStore();
  const [showTokenSearch, setShowTokenSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopyRoomKey = () => {
    if (roomKey) {
      navigator.clipboard.writeText(roomKey);
    }
  };

  const handleRestart = () => {
    if (confirm('Are you sure you want to restart the game? This will reset all players.')) {
      restart();
    }
    setShowMenu(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={shuffle}
          className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded"
          title="Shuffle library"
        >
          Shuffle
        </button>

        <button
          onClick={() => setShowTokenSearch(true)}
          className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded"
          title="Search for tokens"
        >
          Tokens
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded"
          >
            Menu
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
              <button
                onClick={handleCopyRoomKey}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
              >
                Copy Room Code
              </button>
              <button
                onClick={handleRestart}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400"
              >
                Restart Game
              </button>
            </div>
          )}
        </div>
      </div>

      {showTokenSearch && (
        <TokenSearch onClose={() => setShowTokenSearch(false)} />
      )}
    </>
  );
}

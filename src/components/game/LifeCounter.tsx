'use client';

import { useGameStore } from '@/store/gameStore';

export function LifeCounter() {
  const { myId, players, setLife } = useGameStore();

  const myPlayer = myId ? players[myId] : null;
  const opponents = Object.values(players).filter((p) => p.odId !== myId);
  const opponent = opponents[0];

  if (!myPlayer) return null;

  return (
    <div className="flex items-center gap-4">
      {/* Opponent life */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 max-w-[60px] truncate" title={opponent?.displayName}>
          {opponent?.displayName ?? 'Opponent'}
        </span>
        <span className={`text-lg font-bold min-w-[32px] text-center ${(opponent?.life ?? 40) <= 0 ? 'text-red-500' : 'text-white'}`}>
          {opponent?.life ?? 40}
        </span>
      </div>

      <span className="text-gray-600 text-sm">vs</span>

      {/* My life */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLife((myPlayer.life ?? 40) - 1)}
          className="w-6 h-6 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-sm font-bold transition-colors"
        >
          -
        </button>
        <span className={`text-lg font-bold min-w-[32px] text-center ${(myPlayer.life ?? 40) <= 0 ? 'text-red-500' : 'text-white'}`}>
          {myPlayer.life ?? 40}
        </span>
        <button
          onClick={() => setLife((myPlayer.life ?? 40) + 1)}
          className="w-6 h-6 rounded bg-green-900/50 hover:bg-green-800/50 text-green-300 text-sm font-bold transition-colors"
        >
          +
        </button>
        <span className="text-xs text-gray-400 max-w-[60px] truncate" title={myPlayer.displayName}>
          {myPlayer.displayName}
        </span>
      </div>
    </div>
  );
}

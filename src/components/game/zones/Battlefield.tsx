'use client';

import type { GameCard, BoardCard } from '@/types';
import { Card } from '../Card';

interface BattlefieldProps {
  cards: GameCard[];
  isOpponent: boolean;
  playerName?: string;
  life?: number;
}

export function Battlefield({ cards, isOpponent, playerName, life = 40 }: BattlefieldProps) {
  return (
    <div className="h-full bg-gray-900/40 relative overflow-hidden">
      {/* Player info overlay */}
      <div className={`absolute ${isOpponent ? 'bottom-2 right-2' : 'top-2 left-2'} z-10 flex items-center gap-3`}>
        {playerName && (
          <span className="text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
            {playerName}
          </span>
        )}
        <span className="text-lg font-bold text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
          {life}
        </span>
      </div>

      {/* Cards on battlefield */}
      <div className="absolute inset-0 p-2">
        {cards.map((card) => {
          const boardCard = card as BoardCard;
          return (
            <div
              key={card.instanceId}
              className="w-16 absolute"
              style={{
                left: boardCard.position ? `${boardCard.position.x * 100}%` : '10px',
                top: boardCard.position ? `${boardCard.position.y * 100}%` : '10px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Card card={card} zone="battlefield" isOpponent={isOpponent} />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-gray-700 text-sm">Battlefield</span>
        </div>
      )}
    </div>
  );
}

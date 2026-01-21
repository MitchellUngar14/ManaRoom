'use client';

import type { GameCard, BoardCard } from '@/types';
import { Card } from '../Card';

interface BattlefieldProps {
  cards: GameCard[];
  isOpponent: boolean;
  mirrorCards?: boolean;
  readOnly?: boolean;
  fullScreen?: boolean;
}

export function Battlefield({ cards, isOpponent, mirrorCards = false, readOnly = false, fullScreen = false }: BattlefieldProps) {
  return (
    <div className={`h-full bg-gray-900/40 relative overflow-hidden ${fullScreen ? 'min-h-screen' : ''}`}>
      {/* Cards on battlefield */}
      <div className="absolute inset-0 p-2">
        {cards.map((card) => {
          const boardCard = card as BoardCard;
          // For opponent cards: mirror the x position (1 - x) so cards appear in correct relative position
          const displayX = isOpponent ? (1 - (boardCard.position?.x ?? 0.5)) : (boardCard.position?.x ?? 0.5);
          const displayY = isOpponent ? (1 - (boardCard.position?.y ?? 0.5)) : (boardCard.position?.y ?? 0.5);
          return (
            <div
              key={card.instanceId}
              className={`w-28 absolute ${mirrorCards ? 'rotate-180' : ''}`}
              style={{
                left: `${displayX * 100}%`,
                top: `${displayY * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Card card={card} zone="battlefield" isOpponent={isOpponent} readOnly={readOnly} />
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

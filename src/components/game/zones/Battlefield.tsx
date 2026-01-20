'use client';

import type { GameCard, BoardCard } from '@/types';
import { Card } from '../Card';

interface BattlefieldProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Battlefield({ cards, isOpponent }: BattlefieldProps) {
  return (
    <div className="h-full bg-green-950/30 rounded-lg p-2 relative overflow-hidden">
      <div className="absolute inset-0 flex flex-wrap content-start gap-2 p-2 overflow-auto">
        {cards.map((card) => {
          const boardCard = card as BoardCard;
          return (
            <div
              key={card.instanceId}
              className="w-20"
              style={
                boardCard.position
                  ? {
                      position: 'absolute',
                      left: `${boardCard.position.x * 100}%`,
                      top: `${boardCard.position.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }
                  : undefined
              }
            >
              <Card card={card} zone="battlefield" isOpponent={isOpponent} />
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Battlefield</span>
        </div>
      )}
    </div>
  );
}

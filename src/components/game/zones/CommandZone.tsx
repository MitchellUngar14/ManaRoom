'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface CommandZoneProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function CommandZone({ cards, isOpponent }: CommandZoneProps) {
  return (
    <div className="h-full bg-yellow-950/30 rounded-lg p-1 flex flex-col items-center justify-center">
      <span className="text-xs text-gray-500 mb-1">Commander</span>
      {cards.length > 0 ? (
        <div className="w-14">
          <Card card={cards[0]} zone="commandZone" isOpponent={isOpponent} />
        </div>
      ) : (
        <div className="w-14 aspect-[488/680] bg-yellow-900/20 rounded border border-dashed border-yellow-800 flex items-center justify-center">
          <span className="text-xs text-yellow-800">Empty</span>
        </div>
      )}
    </div>
  );
}

'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface CommandZoneProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function CommandZone({ cards, isOpponent }: CommandZoneProps) {
  return (
    <div className="h-full bg-amber-950/30 rounded p-1 flex flex-col items-center justify-center min-h-[80px]">
      <span className="text-[10px] text-gray-500 mb-1">Command</span>
      {cards.length > 0 ? (
        <div className="w-10">
          <Card card={cards[0]} zone="commandZone" isOpponent={isOpponent} />
        </div>
      ) : (
        <div className="w-10 aspect-[488/680] bg-amber-900/20 rounded border border-dashed border-amber-800" />
      )}
    </div>
  );
}

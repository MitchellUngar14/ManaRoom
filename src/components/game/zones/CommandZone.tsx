'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface CommandZoneProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function CommandZone({ cards, isOpponent }: CommandZoneProps) {
  return (
    <div className="h-full bg-amber-950/30 rounded p-1 flex flex-col items-center justify-center">
      {cards.length > 0 ? (
        <div className="w-full max-w-[40px]">
          <Card card={cards[0]} zone="commandZone" isOpponent={isOpponent} />
        </div>
      ) : (
        <div className="w-full max-w-[40px] aspect-[488/680] bg-amber-900/20 rounded border border-dashed border-amber-800" />
      )}
      <span className="text-[9px] text-gray-500 mt-1">Command</span>
    </div>
  );
}

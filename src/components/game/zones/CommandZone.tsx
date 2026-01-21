'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface CommandZoneProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function CommandZone({ cards, isOpponent }: CommandZoneProps) {
  return (
    <div className="h-full flex flex-col">
      <span className="text-[9px] text-gray-500 mb-0.5 text-center">Command</span>
      <div className="flex-1 w-20">
        {cards.length > 0 ? (
          <div className="h-full hover:brightness-110 transition-all">
            <Card card={cards[0]} zone="commandZone" isOpponent={isOpponent} />
          </div>
        ) : (
          <div className="card-container bg-amber-900/20 rounded border-2 border-dashed border-amber-700 hover:border-amber-500 transition-colors" />
        )}
      </div>
    </div>
  );
}

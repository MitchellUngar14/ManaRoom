'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface HandProps {
  cards: GameCard[];
}

export function Hand({ cards }: HandProps) {
  return (
    <div className="h-full bg-gray-900/50 rounded-lg p-2 flex items-center gap-1 overflow-x-auto">
      {cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Your hand is empty
        </div>
      ) : (
        cards.map((card) => (
          <div key={card.instanceId} className="w-20 shrink-0">
            <Card card={card} zone="hand" />
          </div>
        ))
      )}
    </div>
  );
}

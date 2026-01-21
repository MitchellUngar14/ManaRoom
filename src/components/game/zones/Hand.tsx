'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface HandProps {
  cards: GameCard[];
}

export function Hand({ cards }: HandProps) {
  return (
    <div className="h-full p-2 flex items-center justify-start gap-1 overflow-x-auto">
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">Hand ({cards.length})</span>
        <div className="w-px h-8 bg-gray-700" />
      </div>
      {cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          Your hand is empty
        </div>
      ) : (
        cards.map((card) => (
          <div key={card.instanceId} className="w-[72px] shrink-0">
            <Card card={card} zone="hand" />
          </div>
        ))
      )}
    </div>
  );
}

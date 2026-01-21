'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';

interface HandProps {
  cards: GameCard[];
}

export function Hand({ cards }: HandProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-1 shrink-0">
        <span className="text-xs text-gray-500">Hand ({cards.length})</span>
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0 px-2 pb-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex items-center gap-1">
          {cards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
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
      </div>
    </div>
  );
}

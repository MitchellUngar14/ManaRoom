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
      <span className="text-[9px] mb-0.5 text-center" style={{ color: 'var(--theme-text-muted)' }}>Command</span>
      <div className="flex-1 w-24">
        {cards.length > 0 ? (
          <div className="h-full hover:brightness-110 transition-all">
            <Card card={cards[0]} zone="commandZone" isOpponent={isOpponent} />
          </div>
        ) : (
          <div
            className="card-container rounded border-2 border-dashed transition-colors"
            style={{
              backgroundColor: 'var(--theme-accent-glow)',
              borderColor: 'var(--theme-accent-muted)',
            }}
          />
        )}
      </div>
    </div>
  );
}

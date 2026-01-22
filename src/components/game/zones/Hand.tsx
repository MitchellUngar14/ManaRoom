'use client';

import type { GameCard } from '@/types';
import { Card } from '../Card';
import { setHoveredCard } from '../GameBoard';

interface HandProps {
  cards: GameCard[];
}

export function Hand({ cards }: HandProps) {
  // Clear hover when pointer is in the hand container but not on a card
  const handleContainerMouseMove = (e: React.PointerEvent) => {
    // Check if the target is the container or the wrapper div (not the card itself)
    const target = e.target as HTMLElement;
    // If we're on the container or a wrapper div (not on an actual card element), clear hover
    if (e.target === e.currentTarget || target.classList.contains('shrink-0')) {
      setHoveredCard(null);
    }
  };

  return (
    <div className="h-full relative overflow-visible">
      {/* Header - positioned absolutely so it doesn't clip cards */}
      <div className="absolute top-1 left-3 z-0">
        <span className="text-xs transition-colors duration-500" style={{ color: 'var(--theme-text-secondary)' }}>Hand ({cards.length})</span>
      </div>

      {/* Cards */}
      <div className="h-full px-4 py-3 overflow-x-auto overflow-y-visible">
        <div
          className="h-full flex items-center gap-2"
          onPointerMove={handleContainerMouseMove}
        >
          {cards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Your hand is empty
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.instanceId} className="w-28 shrink-0 hand-card-wrapper">
                <Card card={card} zone="hand" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { GameCard } from '@/types';
import { Card } from '../Card';

interface GraveyardProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Graveyard({ cards, isOpponent }: GraveyardProps) {
  const [expanded, setExpanded] = useState(false);
  const topCard = cards[cards.length - 1];

  return (
    <>
      <div
        className="h-full bg-gray-800/50 rounded p-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(true)}
        title="View graveyard"
      >
        {topCard ? (
          <div className="w-full max-w-[40px]">
            <Card card={topCard} zone="graveyard" isOpponent={isOpponent} />
          </div>
        ) : (
          <div className="w-full max-w-[40px] aspect-[488/680] bg-gray-700/50 rounded border border-dashed border-gray-600" />
        )}
        <span className="text-[9px] text-gray-500 mt-1">Grave ({cards.length})</span>
      </div>

      {/* Expanded view modal */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isOpponent ? "Opponent's Graveyard" : 'Graveyard'} ({cards.length})
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cards.map((card) => (
                <div key={card.instanceId} className="w-24">
                  <Card card={card} zone="graveyard" isOpponent={isOpponent} />
                </div>
              ))}
              {cards.length === 0 && (
                <p className="text-gray-500">Graveyard is empty</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

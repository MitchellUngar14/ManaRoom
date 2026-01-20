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
        className="h-full bg-gray-800/50 rounded-lg p-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(true)}
        title="View graveyard"
      >
        <span className="text-xs text-gray-500 mb-1">Graveyard</span>
        {topCard ? (
          <div className="w-14">
            <Card card={topCard} zone="graveyard" isOpponent={isOpponent} />
          </div>
        ) : (
          <div className="w-14 aspect-[488/680] bg-gray-700/50 rounded border border-dashed border-gray-600" />
        )}
        <span className="text-xs text-gray-500 mt-1">{cards.length}</span>
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
                className="text-gray-400 hover:text-white"
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

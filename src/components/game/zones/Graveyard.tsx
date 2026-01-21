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
        className="h-full flex flex-col cursor-pointer"
        title="View graveyard"
      >
        <span
          className="text-[9px] text-gray-500 mb-0.5 text-center"
          onClick={() => setExpanded(true)}
        >
          Grave ({cards.length})
        </span>
        <div className="flex-1 w-20">
          {topCard ? (
            <div
              className="h-full hover:brightness-110 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Card card={topCard} zone="graveyard" isOpponent={isOpponent} />
            </div>
          ) : (
            <div
              className="card-container bg-gray-700/30 rounded border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors"
              onClick={() => setExpanded(true)}
            />
          )}
        </div>
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

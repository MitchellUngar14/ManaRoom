'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { GameCard } from '@/types';
import { Card } from '../Card';
import { CardContextMenu } from '../CardContextMenu';
import { useGameStore } from '@/store/gameStore';

interface GraveyardProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Graveyard({ cards, isOpponent }: GraveyardProps) {
  const [expanded, setExpanded] = useState(false);
  const { moveCard } = useGameStore();
  const topCard = cards[cards.length - 1];

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleViewGraveyard = useCallback(() => {
    setExpanded(true);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleReturnToHand = useCallback((card: GameCard) => {
    moveCard(card.instanceId, 'graveyard', 'hand');
  }, [moveCard]);

  const contextMenuOptions = [
    { label: 'View', icon: 'view' as const, onClick: handleViewGraveyard },
  ];

  return (
    <>
      <div
        className="h-full flex flex-col cursor-pointer"
        title="View graveyard"
        onContextMenu={handleContextMenu}
      >
        <span
          className="text-[9px] text-gray-500 mb-0.5 text-center"
          onClick={() => setExpanded(true)}
        >
          Grave ({cards.length})
        </span>
        <div className="flex-1 w-24">
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

      <CardContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />

      {/* Expanded view modal */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
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

            {/* Card list */}
            <div className="flex-1 overflow-y-auto p-4">
              {cards.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Graveyard is empty</p>
              ) : (
                <div className="space-y-1">
                  {cards.map((card) => {
                    const imageUrl = card.imageUrl || card.card?.imageUris?.small || '';

                    return (
                      <div
                        key={card.instanceId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        {/* Card thumbnail */}
                        <div className="relative w-10 h-14 rounded overflow-hidden bg-gray-700 shrink-0">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={card.cardName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[8px] text-gray-500 text-center px-1">
                                {card.cardName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card name */}
                        <span className="flex-1 text-gray-200 group-hover:text-white transition-colors">
                          {card.cardName}
                        </span>

                        {/* Card type (if available) */}
                        {card.card?.typeLine && (
                          <span className="text-xs text-gray-500 hidden sm:block mr-2">
                            {card.card.typeLine}
                          </span>
                        )}

                        {/* Return to hand button (only for own graveyard) */}
                        {!isOpponent && (
                          <button
                            onClick={() => handleReturnToHand(card)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Return to hand"
                          >
                            To Hand
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {!isOpponent && cards.length > 0 && (
              <div className="p-3 border-t border-gray-700 text-center text-xs text-gray-500">
                Hover over a card and click &quot;To Hand&quot; to return it
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

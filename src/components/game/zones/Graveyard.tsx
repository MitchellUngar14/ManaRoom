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

  const handleReturnToBattlefield = useCallback((card: GameCard) => {
    moveCard(card.instanceId, 'graveyard', 'battlefield', { x: 0.5, y: 0.5 });
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
          className="text-[9px] mb-0.5 text-center"
          style={{ color: 'var(--theme-text-muted)' }}
          onClick={() => setExpanded(true)}
        >
          Grave ({cards.length})
        </span>
        <div className="flex-1 w-28">
          {topCard ? (
            <div
              className="h-full hover:brightness-110 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Card card={topCard} zone="graveyard" isOpponent={isOpponent} />
            </div>
          ) : (
            <div
              className="card-container rounded border-2 border-dashed transition-colors"
              style={{
                backgroundColor: 'var(--theme-bg-elevated)',
                borderColor: 'var(--theme-border)',
              }}
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
          className="game-modal-overlay"
          onClick={() => setExpanded(false)}
        >
          <div
            className="game-modal w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="game-modal-header">
              <h3 className="game-modal-title">
                {isOpponent ? "Opponent's Graveyard" : 'Graveyard'} ({cards.length})
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="game-modal-close"
              >
                &times;
              </button>
            </div>

            {/* Card list */}
            <div className="game-modal-body">
              {cards.length === 0 ? (
                <p style={{ color: 'var(--theme-text-muted)' }} className="text-center py-8">Graveyard is empty</p>
              ) : (
                <div className="space-y-1">
                  {cards.map((card) => {
                    const imageUrl = card.imageUrl || card.card?.imageUris?.small || '';

                    return (
                      <div
                        key={card.instanceId}
                        className="flex items-center gap-3 p-2 rounded-lg transition-colors group"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Card thumbnail */}
                        <div className="relative w-10 h-14 rounded overflow-hidden shrink-0" style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}>
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
                              <span className="text-[8px] text-center px-1" style={{ color: 'var(--theme-text-muted)' }}>
                                {card.cardName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card name */}
                        <span className="flex-1 transition-colors" style={{ color: 'var(--theme-text-primary)' }}>
                          {card.cardName}
                        </span>

                        {/* Card type (if available) */}
                        {card.card?.typeLine && (
                          <span className="text-xs hidden sm:block mr-2" style={{ color: 'var(--theme-text-muted)' }}>
                            {card.card.typeLine}
                          </span>
                        )}

                        {/* Return buttons (only for own graveyard) */}
                        {!isOpponent && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReturnToHand(card)}
                              className="game-btn game-btn-small game-btn-accent"
                              title="Return to hand"
                            >
                              To Hand
                            </button>
                            <button
                              onClick={() => handleReturnToBattlefield(card)}
                              className="game-btn game-btn-small"
                              title="Return to battlefield"
                            >
                              To Battlefield
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {!isOpponent && cards.length > 0 && (
              <div className="p-3 text-center text-xs" style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                Hover over a card and click &quot;To Hand&quot; to return it
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

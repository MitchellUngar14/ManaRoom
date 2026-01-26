'use client';

import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GameCard } from '@/types';
import { useGameStore } from '@/store/gameStore';

interface LibraryViewModalProps {
  isOpen: boolean;
  cards: GameCard[];
  onClose: () => void;
}

export function LibraryViewModal({ isOpen, cards, onClose }: LibraryViewModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { moveCard } = useGameStore();

  const handleTutorToHand = useCallback((card: GameCard) => {
    moveCard(card.instanceId, 'library', 'hand');
    onClose();
  }, [moveCard, onClose]);

  const handleTutorToBattlefield = useCallback((card: GameCard) => {
    moveCard(card.instanceId, 'library', 'battlefield', { x: 0.5, y: 0.5 });
    onClose();
  }, [moveCard, onClose]);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return cards;
    }
    const query = searchQuery.toLowerCase();
    return cards.filter(card =>
      card.cardName.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="game-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="game-modal w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="game-modal-header">
              <h2 className="game-modal-title">
                Library ({cards.length} cards)
              </h2>
              <button
                onClick={onClose}
                className="game-modal-close"
              >
                &times;
              </button>
            </div>

            {/* Search */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search library..."
                  className="w-full px-4 py-2 pl-10 rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg-elevated)',
                    border: '1px solid var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--theme-text-muted)' }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    &times;
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  Showing {filteredCards.length} of {cards.length} cards
                </p>
              )}
            </div>

            {/* Card list */}
            <div className="game-modal-body">
              {filteredCards.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--theme-text-muted)' }}>
                  {searchQuery ? 'No cards match your search' : 'Library is empty'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCards.map((card) => {
                    const imageUrl = card.imageUrl || card.card?.imageUris?.small || '';
                    const originalIndex = cards.indexOf(card);

                    return (
                      <div
                        key={card.instanceId}
                        className="flex items-center gap-3 p-2 rounded-lg transition-colors group"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Position number */}
                        <span className="w-8 text-right text-sm font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                          {originalIndex + 1}.
                        </span>

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

                        {/* Tutor buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTutorToHand(card)}
                            className="game-btn game-btn-small game-btn-accent"
                            title="Add to hand"
                          >
                            To Hand
                          </button>
                          <button
                            onClick={() => handleTutorToBattlefield(card)}
                            className="game-btn game-btn-small"
                            title="Put onto battlefield"
                          >
                            To Battlefield
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 text-center text-xs" style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              Top of library is position 1 · Hover over a card and click &quot;To Hand&quot; to tutor
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

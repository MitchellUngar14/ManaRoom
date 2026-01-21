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
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                Library ({cards.length} cards)
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search library..."
                  className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    &times;
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-400">
                  Showing {filteredCards.length} of {cards.length} cards
                </p>
              )}
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredCards.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
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
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        {/* Position number */}
                        <span className="w-8 text-right text-sm text-gray-500 font-mono">
                          {originalIndex + 1}.
                        </span>

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

                        {/* Tutor to hand button */}
                        <button
                          onClick={() => handleTutorToHand(card)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Add to hand"
                        >
                          To Hand
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-gray-700 text-center text-xs text-gray-500">
              Top of library is position 1 · Hover over a card and click &quot;To Hand&quot; to tutor
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

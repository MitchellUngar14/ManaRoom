'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GameCard } from '@/types';
import { useGameStore } from '@/store/gameStore';

interface ScryModalProps {
  isOpen: boolean;
  cards: GameCard[]; // Full library, top card is last in array
  onClose: () => void;
}

type ScryPhase = 'select-count' | 'arrange';

export function ScryModal({ isOpen, cards, onClose }: ScryModalProps) {
  const [phase, setPhase] = useState<ScryPhase>('select-count');
  const [scryCount, setScryCount] = useState(1);
  const [topPile, setTopPile] = useState<GameCard[]>([]);
  const [bottomPile, setBottomPile] = useState<GameCard[]>([]);
  const { scryLibrary } = useGameStore();

  // Get the top X cards (remember: top of library is at the END of the array)
  const startScry = useCallback((count: number) => {
    const topCards = cards.slice(-count).reverse(); // Reverse so index 0 is the top card
    setTopPile(topCards);
    setBottomPile([]);
    setScryCount(count);
    setPhase('arrange');
  }, [cards]);

  const moveToBottom = useCallback((card: GameCard) => {
    setTopPile(prev => prev.filter(c => c.instanceId !== card.instanceId));
    setBottomPile(prev => [...prev, card]);
  }, []);

  const moveToTop = useCallback((card: GameCard) => {
    setBottomPile(prev => prev.filter(c => c.instanceId !== card.instanceId));
    setTopPile(prev => [...prev, card]);
  }, []);

  const moveUpInPile = useCallback((card: GameCard, pile: 'top' | 'bottom') => {
    const setPile = pile === 'top' ? setTopPile : setBottomPile;
    setPile(prev => {
      const index = prev.findIndex(c => c.instanceId === card.instanceId);
      if (index <= 0) return prev;
      const newPile = [...prev];
      [newPile[index - 1], newPile[index]] = [newPile[index], newPile[index - 1]];
      return newPile;
    });
  }, []);

  const moveDownInPile = useCallback((card: GameCard, pile: 'top' | 'bottom') => {
    const setPile = pile === 'top' ? setTopPile : setBottomPile;
    setPile(prev => {
      const index = prev.findIndex(c => c.instanceId === card.instanceId);
      if (index === -1 || index >= prev.length - 1) return prev;
      const newPile = [...prev];
      [newPile[index], newPile[index + 1]] = [newPile[index + 1], newPile[index]];
      return newPile;
    });
  }, []);

  const confirmScry = useCallback(() => {
    // topPile[0] will be drawn first (top of library)
    // bottomPile cards go to the bottom in order (first in bottomPile = closest to top of the bottom cards)
    scryLibrary(
      topPile.map(c => c.instanceId),
      bottomPile.map(c => c.instanceId)
    );
    handleClose();
  }, [topPile, bottomPile, scryLibrary]);

  const handleClose = useCallback(() => {
    setPhase('select-count');
    setScryCount(1);
    setTopPile([]);
    setBottomPile([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const maxScry = Math.min(cards.length, 10);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="game-modal-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="game-modal w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="game-modal-header">
              <h2 className="game-modal-title">
                {phase === 'select-count' ? 'Scry' : `Scry ${scryCount}`}
              </h2>
              <button onClick={handleClose} className="game-modal-close">
                &times;
              </button>
            </div>

            {phase === 'select-count' ? (
              /* Phase 1: Select how many cards to scry */
              <div className="game-modal-body">
                <p className="text-center mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                  How many cards do you want to scry?
                </p>

                {/* Quick select buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => startScry(n)}
                      disabled={n > cards.length}
                      className="game-btn game-btn-accent w-12 h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Custom number input */}
                <div className="flex items-center justify-center gap-3">
                  <span style={{ color: 'var(--theme-text-muted)' }}>Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={maxScry}
                    value={scryCount}
                    onChange={(e) => setScryCount(Math.max(1, Math.min(maxScry, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 rounded text-center"
                    style={{
                      backgroundColor: 'var(--theme-bg-elevated)',
                      border: '1px solid var(--theme-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />
                  <button
                    onClick={() => startScry(scryCount)}
                    disabled={scryCount > cards.length}
                    className="game-btn game-btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Scry
                  </button>
                </div>

                <p className="text-center mt-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  Library has {cards.length} cards
                </p>
              </div>
            ) : (
              /* Phase 2: Arrange cards */
              <>
                <div className="game-modal-body flex gap-4">
                  {/* Top of Library pile */}
                  <div className="flex-1">
                    <h3 className="text-center font-medium mb-2 pb-2" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                      Top of Library
                    </h3>
                    <p className="text-xs text-center mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                      First card will be drawn next
                    </p>
                    <div className="space-y-1 min-h-[100px]">
                      {topPile.length === 0 ? (
                        <p className="text-center py-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                          No cards on top
                        </p>
                      ) : (
                        topPile.map((card, index) => (
                          <CardRow
                            key={card.instanceId}
                            card={card}
                            index={index}
                            total={topPile.length}
                            onMoveUp={() => moveUpInPile(card, 'top')}
                            onMoveDown={() => moveDownInPile(card, 'top')}
                            onMoveToPile={() => moveToBottom(card)}
                            moveToPileLabel="To Bottom"
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch" style={{ backgroundColor: 'var(--theme-border)' }} />

                  {/* Bottom of Library pile */}
                  <div className="flex-1">
                    <h3 className="text-center font-medium mb-2 pb-2" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                      Bottom of Library
                    </h3>
                    <p className="text-xs text-center mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                      These go to the bottom
                    </p>
                    <div className="space-y-1 min-h-[100px]">
                      {bottomPile.length === 0 ? (
                        <p className="text-center py-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                          No cards on bottom
                        </p>
                      ) : (
                        bottomPile.map((card, index) => (
                          <CardRow
                            key={card.instanceId}
                            card={card}
                            index={index}
                            total={bottomPile.length}
                            onMoveUp={() => moveUpInPile(card, 'bottom')}
                            onMoveDown={() => moveDownInPile(card, 'bottom')}
                            onMoveToPile={() => moveToTop(card)}
                            moveToPileLabel="To Top"
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with confirm */}
                <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--theme-border)' }}>
                  <button
                    onClick={() => setPhase('select-count')}
                    className="game-btn"
                  >
                    Back
                  </button>
                  <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {topPile.length} on top · {bottomPile.length} on bottom
                  </span>
                  <button
                    onClick={confirmScry}
                    className="game-btn game-btn-accent"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Helper component for card rows
function CardRow({
  card,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onMoveToPile,
  moveToPileLabel,
}: {
  card: GameCard;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToPile: () => void;
  moveToPileLabel: string;
}) {
  const imageUrl = card.imageUrl || card.card?.imageUris?.small || '';

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg transition-colors group"
      style={{ backgroundColor: 'var(--theme-bg-elevated)' }}
    >
      {/* Position */}
      <span className="w-5 text-center text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="relative w-8 h-11 rounded overflow-hidden shrink-0" style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={card.cardName}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[6px] text-center px-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {card.cardName}
            </span>
          </div>
        )}
      </div>

      {/* Card name */}
      <span className="flex-1 text-sm truncate" style={{ color: 'var(--theme-text-primary)' }}>
        {card.cardName}
      </span>

      {/* Reorder buttons */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded transition-colors disabled:opacity-30"
          style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}
          title="Move up"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded transition-colors disabled:opacity-30"
          style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}
          title="Move down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          onClick={onMoveToPile}
          className="px-2 py-1 rounded text-xs transition-colors"
          style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}
        >
          {moveToPileLabel}
        </button>
      </div>
    </div>
  );
}

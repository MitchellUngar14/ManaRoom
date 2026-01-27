'use client';

import { useState, useCallback } from 'react';
import type { GameCard } from '@/types';
import { Card, CardBack } from '../Card';
import { CardContextMenu } from '../CardContextMenu';
import { LibraryViewModal } from '../LibraryViewModal';
import { ScryModal } from '../ScryModal';
import { useGameStore } from '@/store/gameStore';

interface LibraryProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Library({ cards, isOpponent }: LibraryProps) {
  const { drawCard, shuffle } = useGameStore();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [scryModalOpen, setScryModalOpen] = useState(false);
  const topCard = cards[cards.length - 1];
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const handleClick = () => {
    if (!isOpponent && cards.length > 0) {
      drawCard();
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isOpponent) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, [isOpponent]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleViewLibrary = useCallback(() => {
    setViewModalOpen(true);
    closeContextMenu();
  }, [closeContextMenu]);

  const handleShuffle = useCallback(() => {
    shuffle();
    closeContextMenu();
  }, [shuffle, closeContextMenu]);

  const handleScry = useCallback(() => {
    setScryModalOpen(true);
    closeContextMenu();
  }, [closeContextMenu]);

  const contextMenuOptions = [
    { label: 'Scry', icon: 'scry' as const, onClick: handleScry },
    { label: 'View Library', icon: 'view' as const, onClick: handleViewLibrary },
    { label: 'Shuffle', icon: 'shuffle' as const, onClick: handleShuffle },
  ];

  return (
    <>
      <div
        className="h-full flex flex-col cursor-pointer"
        onContextMenu={handleContextMenu}
        title={isOpponent ? "Opponent's library" : 'Click to draw, or drag to battlefield/hand'}
      >
        <span className="text-[9px] mb-0.5 text-center font-medium" style={{ color: '#e4e4e7', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Library</span>
        <div className="flex-1 w-28 hover:brightness-110 transition-all relative">
          {topCard && !isOpponent ? (
            <>
              <Card card={topCard} zone="library" isOpponent={isOpponent} showBack={true} onClick={handleClick} />
              {/* Card count overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white drop-shadow-lg">{cards.length}</span>
              </div>
            </>
          ) : (
            <CardBack count={cards.length} />
          )}
        </div>
      </div>

      <CardContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />

      <LibraryViewModal
        isOpen={viewModalOpen}
        cards={cards}
        onClose={() => setViewModalOpen(false)}
      />

      <ScryModal
        isOpen={scryModalOpen}
        cards={cards}
        onClose={() => setScryModalOpen(false)}
      />
    </>
  );
}

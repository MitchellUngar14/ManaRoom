'use client';

import { useState, useCallback } from 'react';
import type { GameCard } from '@/types';
import { CardBack } from '../Card';
import { CardContextMenu } from '../CardContextMenu';
import { LibraryViewModal } from '../LibraryViewModal';
import { useGameStore } from '@/store/gameStore';

interface LibraryProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Library({ cards, isOpponent }: LibraryProps) {
  const { drawCard, shuffle } = useGameStore();
  const [viewModalOpen, setViewModalOpen] = useState(false);
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

  const contextMenuOptions = [
    { label: 'View Library', icon: 'view' as const, onClick: handleViewLibrary },
    { label: 'Shuffle', icon: 'shuffle' as const, onClick: handleShuffle },
  ];

  return (
    <>
      <div
        className="h-full flex flex-col cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={isOpponent ? "Opponent's library" : 'Click to draw a card'}
      >
        <span className="text-[9px] text-gray-500 mb-0.5 text-center">Library</span>
        <div className="flex-1 w-24 hover:brightness-110 transition-all">
          <CardBack count={cards.length} />
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
    </>
  );
}

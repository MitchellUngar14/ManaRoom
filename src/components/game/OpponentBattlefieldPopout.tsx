'use client';

import { useEffect, useCallback } from 'react';
import type { PlayerState, GameCard } from '@/types';
import { Battlefield } from './zones/Battlefield';
import { CardPreviewPane } from './CardPreviewPane';
import { useGameStore } from '@/store/gameStore';
import { setHoveredCard, getHoveredCard, getLastHoveredCard, clearLastHoveredCard } from './GameBoard';

interface OpponentBattlefieldPopoutProps {
  opponent: PlayerState;
  roomKey: string;
}

export function OpponentBattlefieldPopout({ opponent, roomKey }: OpponentBattlefieldPopoutProps) {
  const { previewCard, setPreviewCard } = useGameStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // P key toggles preview for hovered card
      if (e.key === 'p' || e.key === 'P') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        const hovered = getHoveredCard();

        if (previewCard) {
          // If preview is open, close it
          clearLastHoveredCard();
          setHoveredCard(previewCard);
          setHoveredCard(null);
          setPreviewCard(null);
        } else {
          // Try to open preview - prefer currently hovered, fall back to last hovered
          const lastHovered = getLastHoveredCard();
          const targetCard = hovered || lastHovered;
          if (targetCard) {
            setPreviewCard(targetCard);
          }
        }
      }

      // Escape closes preview
      if (e.key === 'Escape' && previewCard) {
        setPreviewCard(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewCard, setPreviewCard]);

  const handleClosePreview = useCallback(() => {
    setPreviewCard(null);
  }, [setPreviewCard]);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Minimal header */}
      <header className="bg-gray-900 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">{opponent.displayName}&apos;s Battlefield</h1>
          <span className="text-gray-500 text-sm">Room: {roomKey}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Life:</span>
            <span className="text-2xl font-bold text-red-400">{opponent.life}</span>
          </div>
          <div className="text-sm text-gray-500">
            {opponent.odeck.commander}
          </div>
        </div>
      </header>

      {/* Full-screen battlefield */}
      <div className="flex-1 overflow-hidden">
        <Battlefield
          cards={opponent.zones.battlefield}
          isOpponent={false}
          readOnly={true}
          fullScreen={true}
        />
      </div>

      {/* Card preview pane */}
      <CardPreviewPane
        card={previewCard}
        onClose={handleClosePreview}
      />
    </div>
  );
}

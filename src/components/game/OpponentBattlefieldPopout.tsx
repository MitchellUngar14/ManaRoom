'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlayerState, GameCard } from '@/types';
import { Battlefield } from './zones/Battlefield';
import { CardPreviewPane } from './CardPreviewPane';
import { useGameStore } from '@/store/gameStore';
import { setHoveredCard, getHoveredCard, getLastHoveredCard, clearLastHoveredCard } from './GameBoard';
import { CommandZone } from './zones/CommandZone';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';

interface OpponentBattlefieldPopoutProps {
  opponent: PlayerState;
  roomKey: string;
}

export function OpponentBattlefieldPopout({ opponent, roomKey }: OpponentBattlefieldPopoutProps) {
  const { previewCard, setPreviewCard } = useGameStore();
  const [zoom, setZoom] = useState(1);
  const [zonesModalOpen, setZonesModalOpen] = useState(false);

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
      {/* Header with opponent info */}
      <header className="bg-gray-900 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">{opponent.displayName}&apos;s Battlefield</h1>
          <span className="text-gray-500 text-sm">Room: {roomKey}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Zone counts */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">
              Hand: <span className="text-white font-medium">{opponent.zones.hand.length}</span>
            </span>
            <span className="text-gray-400">
              Library: <span className="text-white font-medium">{opponent.zones.library.length}</span>
            </span>
            <button
              onClick={() => setZonesModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View Zones
            </button>
          </div>
          <span className="text-gray-600">|</span>
          {/* Life total */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Life:</span>
            <span className="text-2xl font-bold text-red-400">{opponent.life}</span>
          </div>
          <div className="text-sm text-gray-500">
            {opponent.odeck.commander}
          </div>
        </div>
      </header>

      {/* Zoom controls */}
      <div className="absolute top-16 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          className="bg-gray-800/90 hover:bg-gray-700 w-8 h-8 rounded flex items-center justify-center text-gray-300 text-lg"
          title="Zoom in"
        >
          +
        </button>
        <div className="bg-gray-800/90 px-2 py-1 rounded text-center text-xs text-gray-400">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          className="bg-gray-800/90 hover:bg-gray-700 w-8 h-8 rounded flex items-center justify-center text-gray-300 text-lg"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => setZoom(1)}
          className="bg-gray-800/90 hover:bg-gray-700 w-8 h-8 rounded flex items-center justify-center text-gray-300 text-xs mt-1"
          title="Reset zoom"
        >
          1:1
        </button>
      </div>

      {/* Battlefield container - fills available space with zoom */}
      <div className="flex-1 overflow-auto">
        <div
          style={{
            width: `${zoom * 100}%`,
            height: `${zoom * 100}%`,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <Battlefield
            cards={opponent.zones.battlefield}
            isOpponent={false}
            ownerId={opponent.odId}
            allowTakeControl={true}
            readOnly={false}
            largeCards={true}
          />
        </div>
      </div>

      {/* Zones modal */}
      {zonesModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setZonesModalOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{opponent.displayName}&apos;s Zones</h3>
              <button
                onClick={() => setZonesModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex justify-center gap-2">
              <div className="h-32">
                <CommandZone cards={opponent.zones.commandZone} isOpponent={true} />
              </div>
              <div className="h-32">
                <Library cards={opponent.zones.library} isOpponent={true} />
              </div>
              <div className="h-32">
                <Graveyard cards={opponent.zones.graveyard} isOpponent={true} />
              </div>
              <div className="h-32">
                <Exile cards={opponent.zones.exile} isOpponent={true} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
              Hand: {opponent.zones.hand.length} cards
            </div>
          </div>
        </div>
      )}

      {/* Card preview pane */}
      <CardPreviewPane
        card={previewCard}
        onClose={handleClosePreview}
      />
    </div>
  );
}

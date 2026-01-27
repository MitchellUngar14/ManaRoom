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
    <div className="h-screen flex flex-col theme-battlefield">
      {/* Header with opponent info */}
      <header className="px-4 py-2 flex justify-between items-center shrink-0 border-b" style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg" style={{ color: 'var(--theme-text-primary)' }}>{opponent.displayName}&apos;s Battlefield</h1>
          <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Room: {roomKey}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Zone counts */}
          <div className="flex items-center gap-3 text-sm">
            <span style={{ color: 'var(--theme-text-secondary)' }}>
              Hand: <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{opponent.zones.hand.length}</span>
            </span>
            <span style={{ color: 'var(--theme-text-secondary)' }}>
              Library: <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{opponent.zones.library.length}</span>
            </span>
            <button
              onClick={() => setZonesModalOpen(true)}
              className="underline hover:opacity-80"
              style={{ color: 'var(--theme-accent)' }}
            >
              View Zones
            </button>
          </div>
          <span style={{ color: 'var(--theme-border)' }}>|</span>
          {/* Life total */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Life:</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>{opponent.life}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {opponent.odeck.commander}
          </div>
        </div>
      </header>

      {/* Zoom controls */}
      <div className="absolute top-16 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          className="game-btn w-8 h-8 rounded flex items-center justify-center text-lg"
          title="Zoom in"
        >
          +
        </button>
        <div className="px-2 py-1 rounded text-center text-xs" style={{ backgroundColor: 'var(--theme-bg-elevated)', color: 'var(--theme-text-secondary)' }}>
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          className="game-btn w-8 h-8 rounded flex items-center justify-center text-lg"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => setZoom(1)}
          className="game-btn w-8 h-8 rounded flex items-center justify-center text-xs mt-1"
          title="Reset zoom"
        >
          1:1
        </button>
      </div>

      {/* Battlefield container - fills available space with zoom */}
      <div className={`flex-1 ${zoom >= 1 ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center'}`}>
        <div
          style={zoom >= 1 ? {
            width: `${zoom * 100}%`,
            height: `${zoom * 100}%`,
            minWidth: '100%',
            minHeight: '100%',
          } : {
            width: '100%',
            height: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
        >
          <Battlefield
            cards={opponent.zones.battlefield}
            isOpponent={true}
            ownerId={opponent.odId}
            allowTakeControl={true}
            readOnly={false}
            largeCards={true}
            showEntryEffects={true}
          />
        </div>
      </div>

      {/* Zones modal */}
      {zonesModalOpen && (
        <div
          className="game-modal-overlay"
          onClick={() => setZonesModalOpen(false)}
        >
          <div
            className="game-modal max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="game-modal-header">
              <h3 className="game-modal-title">{opponent.displayName}&apos;s Zones</h3>
              <button
                onClick={() => setZonesModalOpen(false)}
                className="game-modal-close"
              >
                &times;
              </button>
            </div>

            <div className="game-modal-body">
              <div className="flex justify-center gap-2">
                <div className="h-44">
                  <CommandZone cards={opponent.zones.commandZone} isOpponent={true} />
                </div>
                <div className="h-44">
                  <Library cards={opponent.zones.library} isOpponent={true} />
                </div>
                <div className="h-44">
                  <Graveyard cards={opponent.zones.graveyard} isOpponent={true} />
                </div>
                <div className="h-44">
                  <Exile cards={opponent.zones.exile} isOpponent={true} />
                </div>
              </div>

              <div className="mt-4 pt-4 text-center text-sm" style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                Hand: {opponent.zones.hand.length} cards
              </div>
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

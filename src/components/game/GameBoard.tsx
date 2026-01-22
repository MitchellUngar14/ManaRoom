'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { Card } from './Card';
import { Hand } from './zones/Hand';
import { Battlefield } from './zones/Battlefield';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';
import { CommandZone } from './zones/CommandZone';
import { CardPreviewPane } from './CardPreviewPane';
import { CardEditModal } from './CardEditModal';
import { AmbientEffects } from './AmbientEffects';
import { useTheme } from '@/hooks/useTheme';
import type { GameCard, BoardCard, ZoneType, PlayerState } from '@/types';

// Global state for hovered card (used by keyboard shortcut)
let hoveredCard: GameCard | null = null;
let hoveredCardZone: ZoneType | null = null;
let lastHoveredCard: GameCard | null = null; // Persists even when mouse leaves for preview
let lastHoveredCardZone: ZoneType | null = null;
export function setHoveredCard(card: GameCard | null, zone?: ZoneType) {
  if (card) {
    hoveredCard = card;
    lastHoveredCard = card;
    if (zone) {
      hoveredCardZone = zone;
      lastHoveredCardZone = zone;
    }
  } else {
    hoveredCard = null;
    hoveredCardZone = null;
  }
}
// Clear hovered card only if it matches the card being left
// This prevents race conditions when moving fast between cards
export function clearHoveredCard(card: GameCard) {
  if (hoveredCard?.instanceId === card.instanceId) {
    hoveredCard = null;
    hoveredCardZone = null;
  }
}
export function getHoveredCard() {
  return hoveredCard;
}
export function getHoveredCardZone() {
  return hoveredCardZone;
}
export function getLastHoveredCard() {
  return lastHoveredCard;
}
export function getLastHoveredCardZone() {
  return lastHoveredCardZone;
}
export function clearLastHoveredCard() {
  lastHoveredCard = null;
  lastHoveredCardZone = null;
}

function DropZone({
  id,
  children,
  className,
}: {
  id: ZoneType;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`h-full ${className || ''} ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

// Opponent zones popout component
function OpponentZonesPopout({ opponent }: { opponent: PlayerState }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button - positioned in top-left of opponent battlefield */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-2 left-2 z-20 bg-gray-800/90 hover:bg-gray-700 px-3 py-1.5 rounded text-xs text-gray-300 flex items-center gap-2 transition-colors"
      >
        <span>{opponent.displayName}</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Hand: {opponent.zones.hand.length}</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Lib: {opponent.zones.library.length}</span>
      </button>

      {/* Popout modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{opponent.displayName}&apos;s Zones</h3>
              <button
                onClick={() => setIsOpen(false)}
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
    </>
  );
}

export function GameBoard() {
  const { myId, players, roomKey, moveCard, repositionCard, previewCard, setPreviewCard } = useGameStore();
  const { isPopoutOpen, openPopout, closePopout } = usePopoutWindow();
  const { theme } = useTheme();
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneType | null>(null);
  const [mirrorOpponent, setMirrorOpponent] = useState(false);
  const [bottomBarCollapsed, setBottomBarCollapsed] = useState(false);
  const [editingCard, setEditingCard] = useState<BoardCard | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl key toggles bottom bar
      if (e.key === 'Control') {
        setBottomBarCollapsed(prev => !prev);
      }

      // P key toggles preview for hovered card
      if (e.key === 'p' || e.key === 'P') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        const hovered = getHoveredCard();

        if (previewCard) {
          // If preview is open, close it
          // Set lastHovered to the preview card so P can re-open it
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

      // T key taps/untaps hovered card on battlefield
      if (e.key === 't' || e.key === 'T') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        const hovered = getHoveredCard();
        const hoveredZone = getHoveredCardZone();
        const lastHovered = getLastHoveredCard();
        const lastZone = getLastHoveredCardZone();

        // Use currently hovered card, or fall back to last hovered
        const targetCard = hovered || lastHovered;
        const targetZone = hovered ? hoveredZone : lastZone;

        // Only tap/untap if the card is on the battlefield
        if (targetCard && targetZone === 'battlefield') {
          useGameStore.getState().tapCard(targetCard.instanceId);
        }
      }

      // E key opens edit modal for hovered card on battlefield (own cards only)
      if (e.key === 'e' || e.key === 'E') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        const hovered = getHoveredCard();
        const hoveredZone = getHoveredCardZone();
        const lastHovered = getLastHoveredCard();
        const lastZone = getLastHoveredCardZone();

        // Use currently hovered card, or fall back to last hovered
        const targetCard = hovered || lastHovered;
        const targetZone = hovered ? hoveredZone : lastZone;

        // Only edit if the card is on the battlefield and it's our card
        if (targetCard && targetZone === 'battlefield') {
          // Check if it's our card by seeing if it exists in our battlefield
          const { myId, players } = useGameStore.getState();
          if (myId && players[myId]) {
            const isOurCard = players[myId].zones.battlefield.some(
              c => c.instanceId === targetCard.instanceId
            );
            if (isOurCard) {
              setEditingCard(targetCard as BoardCard);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewCard, setPreviewCard]);

  const myPlayer = myId ? players[myId] : null;
  const opponents = Object.values(players).filter((p) => p.odId !== myId);
  const opponent = opponents[0]; // For 1v1, just get the first opponent

  const handleDragStart = (event: DragStartEvent) => {
    const { card, zone } = event.active.data.current as {
      card: GameCard;
      zone: ZoneType;
    };
    setActiveCard(card);
    setActiveZone(zone);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveZone(null);

    if (!over || !active.data.current) return;

    const fromZone = active.data.current.zone as ZoneType;
    const toZone = over.id as ZoneType;
    const cardId = active.id as string;

    // Calculate position for battlefield
    let position: { x: number; y: number } | undefined;
    if (toZone === 'battlefield') {
      const overRect = over.rect;
      const translated = active.rect.current.translated;

      if (overRect && translated) {
        position = {
          x: Math.max(0.05, Math.min(0.95, (translated.left - overRect.left + translated.width / 2) / overRect.width)),
          y: Math.max(0.05, Math.min(0.95, (translated.top - overRect.top + translated.height / 2) / overRect.height)),
        };
      } else {
        position = { x: 0.5, y: 0.5 };
      }
    }

    // Handle repositioning within battlefield
    if (fromZone === 'battlefield' && toZone === 'battlefield' && position) {
      repositionCard(cardId, position);
      return;
    }

    // Skip if same zone (except battlefield which is handled above)
    if (fromZone === toZone) return;

    moveCard(cardId, fromZone, toZone, position);
  };

  if (!myPlayer) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Loading game state...</p>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      {/* Ambient Effects Layer */}
      <AmbientEffects theme={theme} />

      <div className="h-full flex flex-col theme-battlefield relative z-10">
        {/* Battlefield area - full width */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Opponent's battlefield (top half) - hidden when popped out */}
          {!isPopoutOpen && (
            <div className="flex-1 border-b relative transition-colors duration-500" style={{ borderColor: 'var(--theme-border)' }}>
              {opponent ? (
                <>
                  {/* Opponent zones popout button */}
                  <OpponentZonesPopout opponent={opponent} />

                  {/* Pop out button */}
                  <button
                    onClick={() => roomKey && myId && openPopout(roomKey, opponent.odId, myId)}
                    className="absolute top-2 right-24 z-20 bg-gray-800/90 hover:bg-gray-700 px-3 py-1.5 rounded text-xs text-gray-300 flex items-center gap-1.5 transition-colors"
                    title="Pop out opponent's battlefield to separate window"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span>Pop Out</span>
                  </button>

                  {/* Mirror toggle button */}
                  <button
                    onClick={() => setMirrorOpponent(!mirrorOpponent)}
                    className="absolute top-2 right-2 z-20 bg-gray-800/90 hover:bg-gray-700 px-3 py-1.5 rounded text-xs text-gray-300 flex items-center gap-1.5 transition-colors"
                    title={mirrorOpponent ? 'Show mirrored view' : 'Show cards right-side up'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={mirrorOpponent ? 'text-blue-400' : ''}
                    >
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                    <span>{mirrorOpponent ? 'Mirrored' : 'Mirror'}</span>
                  </button>

                  {/* Opponent battlefield */}
                  <div className="absolute inset-0">
                    <Battlefield
                      cards={opponent.zones.battlefield}
                      isOpponent={true}
                      ownerId={opponent.odId}
                      allowTakeControl={true}
                      mirrorCards={!mirrorOpponent}
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--theme-bg-secondary)', opacity: 0.5 }}>
                  <span className="transition-colors duration-500" style={{ color: 'var(--theme-text-secondary)' }}>Waiting for opponent...</span>
                </div>
              )}
            </div>
          )}

          {/* Popout indicator bar - shown when battlefield is popped out */}
          {isPopoutOpen && opponent && (
            <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">
                  {opponent.displayName}&apos;s battlefield is in a separate window
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-500 text-sm">Life: {opponent.life}</span>
              </div>
              <button
                onClick={closePopout}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
              >
                Close Popout
              </button>
            </div>
          )}

          {/* My battlefield (bottom half - expands when opponent is popped out) */}
          <DropZone id="battlefield" className="flex-1">
            <Battlefield
              cards={myPlayer.zones.battlefield}
              isOpponent={false}
              largeCards={isPopoutOpen}
              onEditCard={setEditingCard}
            />
          </DropZone>
        </div>

        {/* Bottom bar: Hand + Zones */}
        <div className="relative">
          {/* Collapse toggle button - positioned at bottom of battlefield */}
          <button
            onClick={() => setBottomBarCollapsed(!bottomBarCollapsed)}
            className="absolute bottom-full left-1/2 -translate-x-1/2 z-20 bg-gray-800 hover:bg-gray-700 px-3 py-0.5 rounded-t"
            title={bottomBarCollapsed ? 'Show hand & zones' : 'Hide hand & zones'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-gray-400 transition-transform duration-300 ${
                bottomBarCollapsed ? '' : 'rotate-180'
              }`}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              bottomBarCollapsed ? 'h-0' : 'h-52'
            }`}
          >
            <div className="h-52 border-t flex transition-colors duration-500" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-tertiary)' }}>
              {/* My zones (left side) */}
              <div className="shrink-0 border-r px-2 py-1 flex items-center gap-1 transition-colors duration-500" style={{ borderColor: 'var(--theme-border)' }}>
                <DropZone id="commandZone" className="w-24 shrink-0">
                  <CommandZone cards={myPlayer.zones.commandZone} isOpponent={false} />
                </DropZone>
                <DropZone id="library" className="w-24 shrink-0">
                  <Library cards={myPlayer.zones.library} isOpponent={false} />
                </DropZone>
                <DropZone id="graveyard" className="w-24 shrink-0">
                  <Graveyard cards={myPlayer.zones.graveyard} isOpponent={false} />
                </DropZone>
                <DropZone id="exile" className="w-24 shrink-0">
                  <Exile cards={myPlayer.zones.exile} isOpponent={false} />
                </DropZone>
              </div>

              {/* Hand (right side, takes remaining space) */}
              <DropZone id="hand" className="flex-1 min-w-0 overflow-hidden">
                <Hand cards={myPlayer.zones.hand} />
              </DropZone>
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeCard && (
          <div className={`${isPopoutOpen && activeZone === 'battlefield' ? 'w-40' : 'w-28'} pointer-events-none`}>
            <Card
              card={activeCard}
              zone={activeZone || 'hand'}
              isDragOverlay
            />
          </div>
        )}
      </DragOverlay>

      {/* Card preview pane */}
      <CardPreviewPane
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />

      {/* Card edit modal */}
      <CardEditModal
        isOpen={editingCard !== null}
        card={editingCard}
        onClose={() => setEditingCard(null)}
      />
    </DndContext>
  );
}

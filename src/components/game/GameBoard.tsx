'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { Card } from './Card';
import { Hand } from './zones/Hand';
import { Battlefield } from './zones/Battlefield';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';
import { CommandZone } from './zones/CommandZone';
import { CardPreviewPane } from './CardPreviewPane';
import type { GameCard, ZoneType, PlayerState } from '@/types';

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

            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center">
                <Library cards={opponent.zones.library} isOpponent={true} />
              </div>
              <div className="flex flex-col items-center">
                <Graveyard cards={opponent.zones.graveyard} isOpponent={true} />
              </div>
              <div className="flex flex-col items-center">
                <Exile cards={opponent.zones.exile} isOpponent={true} />
              </div>
              <div className="flex flex-col items-center">
                <CommandZone cards={opponent.zones.commandZone} isOpponent={true} />
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
  const { myId, players, moveCard, repositionCard, previewCard, setPreviewCard } = useGameStore();
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneType | null>(null);
  const [mirrorOpponent, setMirrorOpponent] = useState(false);
  const [bottomBarCollapsed, setBottomBarCollapsed] = useState(false);

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
      <div className="h-full flex flex-col bg-gray-950">
        {/* Battlefield area - full width */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Opponent's battlefield (top half) */}
          <div className="flex-1 border-b border-gray-700 relative">
            {opponent ? (
              <>
                {/* Opponent zones popout button */}
                <OpponentZonesPopout opponent={opponent} />

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
                    mirrorCards={!mirrorOpponent}
                  />
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900/30">
                <span className="text-gray-600">Waiting for opponent...</span>
              </div>
            )}
          </div>

          {/* My battlefield (bottom half) */}
          <DropZone id="battlefield" className="flex-1">
            <Battlefield
              cards={myPlayer.zones.battlefield}
              isOpponent={false}
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
              bottomBarCollapsed ? 'h-0' : 'h-36'
            }`}
          >
            <div className="h-36 border-t border-gray-800 bg-gray-900/80 flex">
              {/* My zones (left side) */}
              <div className="w-64 border-r border-gray-800 p-2 flex items-center gap-2">
                <DropZone id="commandZone" className="w-14 shrink-0">
                  <CommandZone cards={myPlayer.zones.commandZone} isOpponent={false} />
                </DropZone>
                <DropZone id="library" className="w-14 shrink-0">
                  <Library cards={myPlayer.zones.library} isOpponent={false} />
                </DropZone>
                <DropZone id="graveyard" className="w-14 shrink-0">
                  <Graveyard cards={myPlayer.zones.graveyard} isOpponent={false} />
                </DropZone>
                <DropZone id="exile" className="w-14 shrink-0">
                  <Exile cards={myPlayer.zones.exile} isOpponent={false} />
                </DropZone>
              </div>

              {/* Hand (right side, takes remaining space) */}
              <DropZone id="hand" className="flex-1">
                <Hand cards={myPlayer.zones.hand} />
              </DropZone>
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeCard && (
          <div className="w-20 opacity-90 pointer-events-none">
            <Card
              card={activeCard}
              zone={activeZone || 'hand'}
              isDragging
            />
          </div>
        )}
      </DragOverlay>

      {/* Card preview pane */}
      <CardPreviewPane
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </DndContext>
  );
}

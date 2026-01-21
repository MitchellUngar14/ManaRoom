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
import type { GameCard, ZoneType } from '@/types';

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
      className={`${className} ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

export function GameBoard() {
  const { myId, players, moveCard } = useGameStore();
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneType | null>(null);

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

    if (fromZone === toZone) return;

    const cardId = active.id as string;

    // Get drop position for battlefield
    let position: { x: number; y: number } | undefined;
    if (toZone === 'battlefield' && over.rect) {
      const rect = over.rect;
      position = {
        x: (event.delta.x + (active.rect.current.translated?.left || 0) - rect.left) / rect.width,
        y: (event.delta.y + (active.rect.current.translated?.top || 0) - rect.top) / rect.height,
      };
    }

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
        {/* Main game area */}
        <div className="flex-1 flex min-h-0">
          {/* Left side - Battlefield area (split in half) */}
          <div className="flex-1 flex flex-col">
            {/* Opponent's battlefield (top half) - rotated 180deg */}
            <div className="flex-1 border-b border-gray-700 relative">
              {opponent ? (
                <div className="absolute inset-0 rotate-180">
                  <DropZone id="battlefield" className="h-full pointer-events-none">
                    <Battlefield
                      cards={opponent.zones.battlefield}
                      isOpponent={true}
                      playerName={opponent.displayName}
                      life={40}
                    />
                  </DropZone>
                </div>
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
                playerName={myPlayer.displayName}
                life={40}
              />
            </DropZone>
          </div>

          {/* Right side - Zone panels */}
          <div className="w-72 flex flex-col bg-gray-900/50 border-l border-gray-800">
            {/* Opponent zones (top) */}
            <div className="flex-1 p-3 border-b border-gray-700">
              {opponent ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      {opponent.displayName}
                    </span>
                    <span className="text-xs text-gray-500">
                      Hand: {opponent.zones.hand.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Library cards={opponent.zones.library} isOpponent={true} />
                    <Graveyard cards={opponent.zones.graveyard} isOpponent={true} />
                    <Exile cards={opponent.zones.exile} isOpponent={true} />
                    <CommandZone cards={opponent.zones.commandZone} isOpponent={true} />
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                  Opponent zones
                </div>
              )}
            </div>

            {/* My zones (bottom) */}
            <div className="flex-1 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {myPlayer.displayName}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <DropZone id="library">
                  <Library cards={myPlayer.zones.library} isOpponent={false} />
                </DropZone>
                <DropZone id="graveyard">
                  <Graveyard cards={myPlayer.zones.graveyard} isOpponent={false} />
                </DropZone>
                <DropZone id="exile">
                  <Exile cards={myPlayer.zones.exile} isOpponent={false} />
                </DropZone>
                <DropZone id="commandZone">
                  <CommandZone cards={myPlayer.zones.commandZone} isOpponent={false} />
                </DropZone>
              </div>
            </div>
          </div>
        </div>

        {/* My hand (bottom) */}
        <DropZone id="hand" className="h-32 border-t border-gray-800 bg-gray-900/80">
          <Hand cards={myPlayer.zones.hand} />
        </DropZone>
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
    </DndContext>
  );
}

'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { PlayerArea } from './PlayerArea';
import { Card } from './Card';
import type { GameCard, ZoneType } from '@/types';

export function GameBoard() {
  const { myId, players, moveCard } = useGameStore();
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneType | null>(null);

  const myPlayer = myId ? players[myId] : null;
  const opponents = Object.values(players).filter((p) => p.odId !== myId);

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
      <div className="h-full flex flex-col">
        {/* Opponent area */}
        {opponents.map((opponent) => (
          <div key={opponent.odId} className="h-1/3 border-b border-gray-800">
            <PlayerArea player={opponent} isOpponent />
          </div>
        ))}

        {/* If no opponent yet, show placeholder */}
        {opponents.length === 0 && (
          <div className="h-1/3 border-b border-gray-800 flex items-center justify-center bg-gray-900/50">
            <p className="text-gray-500">Waiting for opponent...</p>
          </div>
        )}

        {/* My area */}
        <div className="flex-1">
          <PlayerArea player={myPlayer} isOpponent={false} />
        </div>
      </div>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeCard && (
          <div className="w-24 opacity-80">
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

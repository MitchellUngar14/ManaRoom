'use client';

import { useDroppable } from '@dnd-kit/core';
import type { PlayerState, ZoneType } from '@/types';
import { Hand } from './zones/Hand';
import { Battlefield } from './zones/Battlefield';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';
import { CommandZone } from './zones/CommandZone';

interface PlayerAreaProps {
  player: PlayerState;
  isOpponent: boolean;
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
      className={`${className} ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

export function PlayerArea({ player, isOpponent }: PlayerAreaProps) {
  const zones = player.zones;

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {/* Player info bar */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.displayName}</span>
          <span className="text-gray-500 text-sm">
            ({player.odeck.commander})
          </span>
        </div>
        <div className="text-sm text-gray-400">
          Life: {player.life ?? 40}
        </div>
      </div>

      {/* Main play area */}
      <div className="flex-1 flex gap-2">
        {/* Left sidebar: Library, Graveyard, Exile, Command Zone */}
        <div className="w-40 flex flex-col gap-2">
          <DropZone id="commandZone" className="h-44">
            <CommandZone cards={zones.commandZone} isOpponent={isOpponent} />
          </DropZone>
          <DropZone id="library" className="h-44">
            <Library cards={zones.library} isOpponent={isOpponent} />
          </DropZone>
          <DropZone id="graveyard" className="flex-1">
            <Graveyard cards={zones.graveyard} isOpponent={isOpponent} />
          </DropZone>
          <DropZone id="exile" className="h-44">
            <Exile cards={zones.exile} isOpponent={isOpponent} />
          </DropZone>
        </div>

        {/* Center: Battlefield */}
        <DropZone id="battlefield" className="flex-1">
          <Battlefield cards={zones.battlefield} isOpponent={isOpponent} />
        </DropZone>
      </div>

      {/* Hand (only show for self) */}
      {!isOpponent && (
        <DropZone id="hand" className="h-32">
          <Hand cards={zones.hand} />
        </DropZone>
      )}

      {/* Opponent's hand indicator */}
      {isOpponent && (
        <div className="h-8 flex items-center justify-center bg-gray-800/50 rounded">
          <span className="text-sm text-gray-500">
            {zones.hand.length} cards in hand
          </span>
        </div>
      )}
    </div>
  );
}

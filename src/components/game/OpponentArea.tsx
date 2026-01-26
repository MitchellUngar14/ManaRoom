'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerState } from '@/types';
import { Battlefield } from './zones/Battlefield';
import { CommandZone } from './zones/CommandZone';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';
import { OpponentThumbnail } from './OpponentThumbnail';
import { BattlefieldContextMenu, type BattlefieldMenuOption } from './BattlefieldContextMenu';

interface OpponentAreaProps {
  opponents: PlayerState[];
  poppedOutIds: string[];
  mirrorOpponent: boolean;
  onToggleMirror: () => void;
  onPopout: (opponentId: string) => void;
  roomKey: string | null;
  myId: string | null;
}

// Opponent zones popout modal component
function OpponentZonesModal({ opponent, isOpen, onClose }: { opponent: PlayerState; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div
        className="game-modal"
        style={{ width: '100%', maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="game-modal-header">
          <h3 className="game-modal-title">{opponent.displayName}&apos;s Zones</h3>
          <button onClick={onClose} className="game-modal-close">
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

          <div
            className="mt-4 pt-4 text-center"
            style={{ borderTop: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)', fontSize: '14px' }}
          >
            Hand: {opponent.zones.hand.length} cards
          </div>
        </div>
      </div>
    </div>
  );
}

// Opponent info button that opens zones modal
function OpponentInfoButton({ opponent, onClick }: { opponent: PlayerState; onClick: () => void }) {
  return (
    <button onClick={onClick} className="absolute top-2 left-2 z-20 game-btn game-btn-small">
      <span>{opponent.displayName}</span>
      <span className="game-info-divider" style={{ height: '12px', margin: '0 4px' }} />
      <span style={{ color: 'var(--theme-text-muted)' }}>Hand: {opponent.zones.hand.length}</span>
      <span className="game-info-divider" style={{ height: '12px', margin: '0 4px' }} />
      <span style={{ color: 'var(--theme-text-muted)' }}>Lib: {opponent.zones.library.length}</span>
    </button>
  );
}

// Calculate scale based on opponent count
function getScaleForOpponentCount(count: number, isFocused: boolean): number {
  if (isFocused) return 1.0;
  switch (count) {
    case 1:
      return 1.0;
    case 2:
      return 0.8;
    case 3:
    default:
      return 0.65;
  }
}

export function OpponentArea({
  opponents,
  poppedOutIds,
  mirrorOpponent,
  onToggleMirror,
  onPopout,
  roomKey,
  myId,
}: OpponentAreaProps) {
  const [focusedOpponentId, setFocusedOpponentId] = useState<string | null>(null);
  const [zonesModalOpponent, setZonesModalOpponent] = useState<PlayerState | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    opponentId: string;
  }>({ isOpen: false, position: { x: 0, y: 0 }, opponentId: '' });

  // Track if focus has ever been used - once used, disable entry effects to prevent
  // animations from triggering when switching between focus and grid views
  const hasFocusedRef = useRef(false);

  // Filter out popped-out opponents
  const visibleOpponents = opponents.filter((o) => !poppedOutIds.includes(o.odId));

  // Get focused opponent if one is set and still visible
  const focusedOpponent = focusedOpponentId
    ? visibleOpponents.find((o) => o.odId === focusedOpponentId)
    : null;

  // If focused opponent is no longer visible (disconnected or popped out), unfocus
  if (focusedOpponentId && !focusedOpponent) {
    setFocusedOpponentId(null);
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, opponentId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      opponentId,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleFocus = useCallback((opponentId: string) => {
    hasFocusedRef.current = true;
    setFocusedOpponentId(opponentId);
  }, []);

  const handleUnfocus = useCallback(() => {
    setFocusedOpponentId(null);
  }, []);

  // Build context menu options
  const getContextMenuOptions = (opponentId: string): BattlefieldMenuOption[] => {
    const isFocused = focusedOpponentId === opponentId;
    const options: BattlefieldMenuOption[] = [];

    if (isFocused) {
      options.push({
        label: 'Unfocus',
        icon: 'unfocus',
        onClick: handleUnfocus,
      });
    } else {
      options.push({
        label: 'Focus',
        icon: 'focus',
        onClick: () => handleFocus(opponentId),
      });
    }

    options.push({
      label: 'Pop Out',
      icon: 'popout',
      onClick: () => onPopout(opponentId),
    });

    return options;
  };

  // No visible opponents
  if (visibleOpponents.length === 0) {
    return (
      <div className="h-full game-waiting">
        <span>Waiting for opponent...</span>
      </div>
    );
  }

  // Focus mode: one opponent enlarged, others in sidebar
  if (focusedOpponent) {
    const otherOpponents = visibleOpponents.filter((o) => o.odId !== focusedOpponent.odId);

    return (
      <div className="h-full flex">
        {/* Main focused battlefield */}
        <div
          className="flex-1 relative"
          onContextMenu={(e) => handleContextMenu(e, focusedOpponent.odId)}
        >
          <OpponentInfoButton opponent={focusedOpponent} onClick={() => setZonesModalOpponent(focusedOpponent)} />

          {/* Unfocus button */}
          <button
            onClick={handleUnfocus}
            className="absolute top-2 right-24 z-20 game-btn game-btn-small"
            title="Exit focus mode"
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
              <path d="M4 14h6v6" />
              <path d="M20 10h-6V4" />
              <path d="M14 10l7-7" />
              <path d="M3 21l7-7" />
            </svg>
            <span>Unfocus</span>
          </button>

          {/* Mirror toggle */}
          <button
            onClick={onToggleMirror}
            className={`absolute top-2 right-2 z-20 game-btn game-btn-small ${mirrorOpponent ? 'game-btn-active' : ''}`}
            title={mirrorOpponent ? 'Show mirrored view' : 'Show cards right-side up'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>{mirrorOpponent ? 'Mirrored' : 'Mirror'}</span>
          </button>

          <div className="absolute inset-0">
            <Battlefield
              cards={focusedOpponent.zones.battlefield}
              isOpponent={true}
              ownerId={focusedOpponent.odId}
              allowTakeControl={true}
              mirrorCards={!mirrorOpponent}
              scale={1.0}
              showEntryEffects={false}
            />
          </div>
        </div>

        {/* Sidebar with other opponents */}
        {otherOpponents.length > 0 && (
          <div className="opponent-thumbnail-sidebar">
            <AnimatePresence>
              {otherOpponents.map((opponent) => (
                <OpponentThumbnail
                  key={opponent.odId}
                  opponent={opponent}
                  isFocused={false}
                  onFocus={() => handleFocus(opponent.odId)}
                  onPopout={() => onPopout(opponent.odId)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Zones modal */}
        <OpponentZonesModal
          opponent={zonesModalOpponent || focusedOpponent}
          isOpen={zonesModalOpponent !== null}
          onClose={() => setZonesModalOpponent(null)}
        />

        {/* Context menu */}
        <BattlefieldContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          options={getContextMenuOptions(contextMenu.opponentId)}
          onClose={handleCloseContextMenu}
        />
      </div>
    );
  }

  // Normal mode: grid of opponents
  const opponentCount = visibleOpponents.length;
  const scale = getScaleForOpponentCount(opponentCount, false);

  return (
    <div className="opponent-area" data-count={opponentCount}>
      {visibleOpponents.map((opponent) => (
        <div
          key={opponent.odId}
          className="opponent-battlefield-cell relative"
          onContextMenu={(e) => handleContextMenu(e, opponent.odId)}
        >
          <OpponentInfoButton opponent={opponent} onClick={() => setZonesModalOpponent(opponent)} />

          {/* Pop out button */}
          <button
            onClick={() => onPopout(opponent.odId)}
            className="absolute top-2 right-24 z-20 game-btn game-btn-small"
            title="Pop out opponent's battlefield to separate window"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Pop Out</span>
          </button>

          {/* Mirror toggle - only show for first opponent to avoid clutter */}
          {opponent === visibleOpponents[0] && (
            <button
              onClick={onToggleMirror}
              className={`absolute top-2 right-2 z-20 game-btn game-btn-small ${mirrorOpponent ? 'game-btn-active' : ''}`}
              title={mirrorOpponent ? 'Show mirrored view' : 'Show cards right-side up'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span>{mirrorOpponent ? 'Mirrored' : 'Mirror'}</span>
            </button>
          )}

          <div className="absolute inset-0">
            <Battlefield
              cards={opponent.zones.battlefield}
              isOpponent={true}
              ownerId={opponent.odId}
              allowTakeControl={true}
              mirrorCards={!mirrorOpponent}
              scale={scale}
              showEntryEffects={!hasFocusedRef.current}
            />
          </div>
        </div>
      ))}

      {/* Zones modal */}
      {zonesModalOpponent && (
        <OpponentZonesModal
          opponent={zonesModalOpponent}
          isOpen={true}
          onClose={() => setZonesModalOpponent(null)}
        />
      )}

      {/* Context menu */}
      <BattlefieldContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        options={getContextMenuOptions(contextMenu.opponentId)}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
}

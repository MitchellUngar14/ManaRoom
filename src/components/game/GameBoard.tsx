'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useMultiPopoutWindow } from '@/hooks/useMultiPopoutWindow';
import { Card } from './Card';
import { OpponentArea } from './OpponentArea';
import { Hand } from './zones/Hand';
import { Battlefield } from './zones/Battlefield';
import { Library } from './zones/Library';
import { Graveyard } from './zones/Graveyard';
import { Exile } from './zones/Exile';
import { CommandZone } from './zones/CommandZone';
import { CardPreviewPane } from './CardPreviewPane';
import { CardEditModal } from './CardEditModal';
import { AmbientEffects } from './AmbientEffects';
import { ZoneGlowEffect } from './ZoneGlowEffect';
import { FancyButton } from './FancyButton';
import { TokenSearch } from './TokenSearch';
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

export function GameBoard() {
  const { myId, players, roomKey, moveCard, repositionCard, removeCard, previewCard, setPreviewCard, untapAll, orderCards, shuffle } = useGameStore();
  const { poppedOutIds, openPopout, closePopout, hasAnyPopouts } = useMultiPopoutWindow();
  const { theme } = useTheme();
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneType | null>(null);
  const [mirrorOpponent, setMirrorOpponent] = useState(false);

  // Handle popout for a specific opponent
  const handlePopout = (opponentId: string) => {
    if (roomKey && myId) {
      openPopout(roomKey, opponentId, myId);
    }
  };
  const [bottomBarCollapsed, setBottomBarCollapsed] = useState(false);
  const [sideZonesCollapsed, setSideZonesCollapsed] = useState(false);
  const [editingCard, setEditingCard] = useState<BoardCard | null>(null);
  const [showPlacementGuides, setShowPlacementGuides] = useState(true);
  const [showTokenSearch, setShowTokenSearch] = useState(false);

  // Configure drag sensor to require movement before activating (allows clicks to work)
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Require 8px movement before drag starts
    },
  });
  const sensors = useSensors(pointerSensor);

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

  // Check if all opponents are popped out
  const allOpponentsPopped = opponents.length > 0 && opponents.every((o) => poppedOutIds.includes(o.odId));

  // Get list of popped out opponents for the indicator bar
  const poppedOutOpponents = opponents.filter((o) => poppedOutIds.includes(o.odId));

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
        // Calculate card height as percentage of battlefield for y constraint
        const cardHeightPercent = translated.height / overRect.height;
        // Minimum y keeps most of the card visible (only small portion can go above)
        const minY = cardHeightPercent * 0.4; // Allow top ~10% of card to potentially go above

        position = {
          x: Math.max(0.05, Math.min(0.95, (translated.left - overRect.left + translated.width / 2) / overRect.width)),
          y: Math.max(minY, Math.min(0.95, (translated.top - overRect.top + translated.height / 2) / overRect.height)),
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

    // Check if card is a token or copy being moved from battlefield to graveyard/exile
    const cardData = active.data.current.card as BoardCard;
    const isTokenOrCopy = cardData?.isToken || cardData?.isCopy;
    if (fromZone === 'battlefield' && (toZone === 'graveyard' || toZone === 'exile') && isTokenOrCopy) {
      // Tokens and copies are removed from the game instead of going to graveyard/exile
      removeCard(cardId, fromZone);
      return;
    }

    moveCard(cardId, fromZone, toZone, position);
  };

  if (!myPlayer) {
    return (
      <div className="h-full flex items-center justify-center game-loading">
        <div className="game-spinner" />
        <p className="game-loading-text">Loading game state...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      {/* Ambient Effects Layer */}
      <AmbientEffects theme={theme} />

      <div className="h-full flex flex-col theme-battlefield relative z-10">
        {/* Battlefield area - full width */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Opponent area (top half) - hidden when all opponents are popped out */}
          {!allOpponentsPopped && (
            <>
              <div className="flex-1 relative transition-colors duration-500">
                <OpponentArea
                  opponents={opponents}
                  poppedOutIds={poppedOutIds}
                  mirrorOpponent={mirrorOpponent}
                  onToggleMirror={() => setMirrorOpponent(!mirrorOpponent)}
                  onPopout={handlePopout}
                  roomKey={roomKey}
                  myId={myId}
                />
              </div>
              {/* Magical divider between battlefields */}
              <div className="relative h-1 shrink-0 overflow-visible">
                {/* Base glow */}
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, var(--theme-accent) 20%, var(--theme-accent) 80%, transparent 100%)`,
                    boxShadow: `0 0 10px var(--theme-accent), 0 0 20px var(--theme-accent-glow), 0 0 30px var(--theme-accent-glow)`,
                  }}
                />
                {/* Animated shimmer */}
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] battlefield-divider-shimmer"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, transparent 40%, white 50%, transparent 60%, transparent 100%)`,
                    backgroundSize: '200% 100%',
                    opacity: 0.4,
                  }}
                />
                {/* Soft outer glow */}
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, var(--theme-accent-glow) 20%, var(--theme-accent-glow) 80%, transparent 100%)`,
                    filter: 'blur(8px)',
                    opacity: 0.5,
                  }}
                />
              </div>
            </>
          )}

          {/* Popout indicator bar - shown when any opponents are popped out */}
          {poppedOutOpponents.length > 0 && (
            <div className="shrink-0 game-popout-bar">
              <div className="game-popout-info">
                {poppedOutOpponents.map((o, idx) => (
                  <span key={o.odId}>
                    {idx > 0 && <span className="game-info-divider" />}
                    <span>{o.displayName} (Life: {o.life})</span>
                    <button
                      onClick={() => closePopout(o.odId)}
                      className="ml-2 hover:text-red-400"
                      title={`Close ${o.displayName}'s popout`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <span style={{ color: 'var(--theme-text-muted)', fontSize: '12px' }}>
                {poppedOutOpponents.length === 1 ? 'Battlefield' : 'Battlefields'} in separate {poppedOutOpponents.length === 1 ? 'window' : 'windows'}
              </span>
            </div>
          )}

          {/* My battlefield (bottom half - expands when all opponents are popped out) */}
          <DropZone id="battlefield" className="flex-1 relative">
            <Battlefield
              cards={myPlayer.zones.battlefield}
              isOpponent={false}
              largeCards={allOpponentsPopped}
              onEditCard={setEditingCard}
              showPlacementGuides={showPlacementGuides}
            />
          </DropZone>
        </div>

        {/* Bottom bar: Hand + Zones */}
        {/* Bottom bar: Hand + Zones */}
        <div className="relative overflow-visible">
          {/* Collapse toggle button - positioned relative to the container, floating above the content */}
          {/* Center Jewel Toggle - Diamond Shape */}


          <div
            className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-700 ease-in-out ${bottomBarCollapsed ? 'translate-y-full' : 'translate-y-0'
              }`}
          >
            <div className="h-52 flex game-hand-zone overflow-visible relative">
              {/* Decorative rail above entire bottom section */}
              {/* Zones Rail (Left) */}
              <div
                className="absolute left-0 z-40 transition-all duration-700 ease-in-out overflow-hidden"
                style={{
                  top: '-40px',
                  width: sideZonesCollapsed ? '0px' : '500px',
                  height: '42px',
                  backgroundImage: 'url(/rail-texture.png)',
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 100%',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', // Clean edges
                  boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              >
                {/* Rail buttons - Zones rail */}
                <div className="absolute left-4 top-[40%] -translate-y-1/2 flex items-center gap-3 pointer-events-auto">
                  <FancyButton
                    onClick={shuffle}
                    cutoutImage="/ShuffleCutout.png"
                    title="Shuffle library"
                  />
                  <FancyButton
                    onClick={() => setShowTokenSearch(true)}
                    cutoutImage="/TokensCutout.png"
                    title="Search for tokens"
                  />
                  <FancyButton
                    onClick={orderCards}
                    cutoutImage="/OrderCutout.png"
                    title="Organize cards by type"
                  />
                </div>
              </div>

              {/* Hand Rail (Right) - Flexes with remaining space */}
              <div
                className="absolute right-0 z-40 transition-all duration-700 ease-in-out"
                style={{
                  top: '-40px',
                  left: sideZonesCollapsed ? '0px' : '500px',
                  height: '42px',
                  backgroundImage: 'url(/rail-texture.png)',
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 100%',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                  pointerEvents: 'none' // Rail itself doesn't block clicks
                }}
              >
                {/* Rail buttons - Right side */}
                <div className="absolute right-4 top-[40%] -translate-y-1/2 flex items-center gap-3 pointer-events-auto">
                  <FancyButton
                    onClick={untapAll}
                    cutoutImage="/UntapAllCutout.png"
                    title="Untap all your cards"
                  />
                  <FancyButton
                    onClick={() => setShowPlacementGuides(!showPlacementGuides)}
                    cutoutImage="/GuidesCutout.png"
                    title={showPlacementGuides ? 'Hide placement guides' : 'Show placement guides'}
                  />
                </div>

                {/* Center Jewel Toggle - Centered in Hand Rail */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-50 flex justify-center items-center pointer-events-auto"
                  style={{
                    top: '-24px', // Float above rail
                    width: '64px',
                    height: '64px',
                  }}
                >
                  <button
                    onClick={() => setBottomBarCollapsed(!bottomBarCollapsed)}
                    className="w-full h-full focus:outline-none filter hover:brightness-125 transition-all active:scale-95 group relative"
                    title={bottomBarCollapsed ? 'Show hand & zones' : 'Hide hand & zones'}
                  >
                    <motion.div
                      className="w-full h-full relative flex items-center justify-center"
                      animate={{
                        rotate: bottomBarCollapsed ? 225 : 45
                      }}
                      transition={{ duration: 0.5, type: 'spring' }}
                    >
                      {/* Diamond Container */}
                      <div className="w-10 h-10 relative transform bg-black shadow-lg overflow-hidden"
                        style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>

                        <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />

                        <img
                          src="/jewel-icon.png"
                          alt="Toggle"
                          className="w-full h-full object-cover"
                          style={{ transform: 'rotate(-45deg) scale(1.4)' }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white opacity-10 pointer-events-none" />
                      </div>
                    </motion.div>
                  </button>
                </div>
              </div>
              {/* My zones (left side) - collapsible */}
              <div
                className="shrink-0 transition-all duration-700 ease-in-out overflow-hidden"
                style={{ width: sideZonesCollapsed ? '0px' : '500px' }}
              >
                <div
                  className="game-side-zones h-full relative"
                  style={{
                    width: '500px',
                    backgroundImage: 'url(/hand-background.png)',
                    backgroundRepeat: 'repeat',
                    backgroundSize: 'auto',
                    boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Rising glow effect from bottom */}
                  <ZoneGlowEffect particleCount={10} intensity="subtle" />

                  <DropZone id="commandZone" className="w-28 shrink-0">
                    <CommandZone cards={myPlayer.zones.commandZone} isOpponent={false} />
                  </DropZone>
                  <DropZone id="library" className="w-28 shrink-0">
                    <Library cards={myPlayer.zones.library} isOpponent={false} />
                  </DropZone>
                  <DropZone id="graveyard" className="w-28 shrink-0">
                    <Graveyard cards={myPlayer.zones.graveyard} isOpponent={false} />
                  </DropZone>
                  <DropZone id="exile" className="w-28 shrink-0">
                    <Exile cards={myPlayer.zones.exile} isOpponent={false} />
                  </DropZone>
                </div>
              </div>

              {/* Side zones collapse toggle */}
              {/* Side zones collapse toggle - Full height divider */}
              {/* Side zones collapse toggle - Below Rail Divider */}
              <div
                className="absolute z-50 flex items-center justify-center pointer-events-auto transition-all duration-700 ease-in-out"
                style={{
                  top: '0px',     // Starts comfortably below the rail (which is at -40px)
                  bottom: '0px',  // Goes to bottom of container
                  left: sideZonesCollapsed ? '-20px' : '480px',
                  width: '40px',
                }}
              >
                <button
                  onClick={() => setSideZonesCollapsed(!sideZonesCollapsed)}
                  className="w-full h-full flex flex-col items-center justify-center focus:outline-none hover:brightness-125 transition-all active:scale-95 group relative"
                  title={sideZonesCollapsed ? 'Show zones' : 'Hide zones'}
                >
                  {/* Toggle Base - Vertically Centered Pillar */}
                  <div
                    className="absolute left-0 right-0 bg-no-repeat bg-center"
                    style={{
                      top: '0',
                      bottom: '0',
                      backgroundImage: 'url(/side-toggle-base.png)',
                      backgroundSize: '100% 100%',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }}
                  />

                  {/* Arrow Icon - Centered */}
                  <motion.div
                    className="w-14 h-14 relative z-10"
                    style={{ marginTop: '-20px' }} // Raise it significantly to center in the visual base
                    animate={{ rotate: sideZonesCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.7 }}
                  >
                    <img
                      src="/side-toggle-arrow.png"
                      alt="Arrow"
                      className="w-full h-full object-contain filter drop-shadow hover:brightness-150"
                    />
                  </motion.div>
                </button>
              </div>



              {/* Hand (right side, takes remaining space) */}
              <DropZone id="hand" className="flex-1 min-w-0 overflow-visible">
                <Hand cards={myPlayer.zones.hand} />
              </DropZone>
            </div>
          </div>
        </div>
      </div >

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {
          activeCard && (
            <motion.div
              className={`${allOpponentsPopped && activeZone === 'battlefield' ? 'w-40' : 'w-28'} pointer-events-none`}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <Card
                card={activeCard}
                zone={activeZone || 'hand'}
                isDragOverlay
              />
            </motion.div>
          )
        }
      </DragOverlay >

      {/* Card preview pane */}
      < CardPreviewPane
        card={previewCard}
        onClose={() => setPreviewCard(null)
        }
      />

      {/* Card edit modal */}
      <CardEditModal
        isOpen={editingCard !== null}
        card={editingCard}
        onClose={() => setEditingCard(null)}
      />

      {/* Token search modal */}
      {showTokenSearch && (
        <TokenSearch onClose={() => setShowTokenSearch(false)} />
      )}
    </DndContext >
  );
}

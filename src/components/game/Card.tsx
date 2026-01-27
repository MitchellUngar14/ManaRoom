'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GameCard, BoardCard, ZoneType } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { CardContextMenu, MenuOption } from './CardContextMenu';
import { setHoveredCard, clearHoveredCard } from './GameBoard';

interface CardProps {
  card: GameCard;
  zone: ZoneType;
  isOpponent?: boolean;
  ownerId?: string;
  allowTakeControl?: boolean;
  showBack?: boolean;
  readOnly?: boolean;
  isDragOverlay?: boolean;
  onClick?: () => void;
  onEditCard?: (card: BoardCard) => void;
}

// Helper to check if a card is a token
function isToken(card: GameCard): boolean {
  // Check for isToken flag (set by server when creating tokens)
  if ('isToken' in card && (card as { isToken?: boolean }).isToken) {
    return true;
  }
  // Check layout field from Scryfall data
  if (card.card?.layout === 'token') {
    return true;
  }
  // Check type line for "Token" keyword
  if (card.card?.typeLine?.includes('Token')) {
    return true;
  }
  return false;
}

// Helper to check if a card is an Equipment
function isEquipment(card: GameCard): boolean {
  const typeLine = card.card?.typeLine?.toLowerCase() || '';
  return typeLine.includes('equipment');
}

// Helper to check if a card is an Aura
function isAura(card: GameCard): boolean {
  const typeLine = card.card?.typeLine?.toLowerCase() || '';
  return typeLine.includes('aura');
}

// Helper to check if a card can be attached (Equipment or Aura)
function canAttach(card: GameCard): boolean {
  return isEquipment(card) || isAura(card);
}

export function Card({
  card,
  zone,
  isOpponent = false,
  ownerId,
  allowTakeControl = false,
  showBack = false,
  readOnly = false,
  isDragOverlay = false,
  onClick,
  onEditCard,
}: CardProps) {
  const { tapCard, setPreviewCard, moveCard, removeCard, takeControl, attachCard, detachCard, attachingCardId, setAttachingCardId } = useGameStore();
  const boardCard = card as BoardCard;
  const isTapped = boardCard.tapped;
  const isBattlefield = zone === 'battlefield';
  const isHand = zone === 'hand';
  const isGraveyard = zone === 'graveyard';
  const isExile = zone === 'exile';
  const isLibrary = zone === 'library';
  // Don't show hover effects on drag overlay cards
  const showHoverEffects = (isHand || isBattlefield) && !isDragOverlay;
  // Cards in graveyard/exile/library should not have their own context menu - the zone handles it
  const disableContextMenu = isGraveyard || isExile || isLibrary;

  const [isHovered, setIsHovered] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { attributes, listeners: dndListeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.instanceId,
    data: { card, zone },
    // Disable dragging for opponent cards, readOnly, and overlay
    disabled: isOpponent || readOnly || isDragOverlay,
  });

  // Clear hover state when drag starts so portal doesn't show stale position
  useEffect(() => {
    if (isDragging) {
      setIsHovered(false);
      setHoverRect(null);
    }
  }, [isDragging]);

  // Merge our pointer handlers with dnd-kit's listeners
  const listeners = {
    ...dndListeners,
    onPointerMove: (e: React.PointerEvent) => {
      // Don't update hover state during drag
      if (!isDragging) {
        setHoveredCard(card, zone);
        if (showHoverEffects) {
          setIsHovered(true);
        }
      }
      dndListeners?.onPointerMove?.(e);
    },
  };

  const handleClick = () => {
    // Check if we're in attach mode and clicked on a valid target
    if (attachingCardId && isBattlefield && attachingCardId !== card.instanceId) {
      attachCard(attachingCardId, card.instanceId);
      setAttachingCardId(null);
      return;
    }

    if (onClick) {
      onClick();
    } else if (isBattlefield && !isOpponent && !readOnly) {
      tapCard(card.instanceId);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Don't show card context menu for graveyard/exile - let the zone handle it
    if (disableContextMenu) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, [disableContextMenu]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Right click is button 2
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handlePreview = useCallback(() => {
    setPreviewCard(card);
  }, [card, setPreviewCard]);

  const handleTap = useCallback(() => {
    tapCard(card.instanceId);
  }, [card.instanceId, tapCard]);

  const handleGoToGraveyard = useCallback(() => {
    if (isToken(card) || boardCard.isCopy) {
      // Tokens and copies are removed from the game when they would go to graveyard
      removeCard(card.instanceId, 'battlefield');
    } else {
      // Regular cards go to graveyard
      moveCard(card.instanceId, 'battlefield', 'graveyard');
    }
  }, [card, boardCard.isCopy, moveCard, removeCard]);

  const handleGoToExile = useCallback(() => {
    if (isToken(card) || boardCard.isCopy) {
      // Tokens and copies are removed from the game when they would go to exile
      removeCard(card.instanceId, 'battlefield');
    } else {
      // Regular cards go to exile
      moveCard(card.instanceId, 'battlefield', 'exile');
    }
  }, [card, boardCard.isCopy, moveCard, removeCard]);

  const handleToTopOfLibrary = useCallback(() => {
    moveCard(card.instanceId, 'hand', 'library', undefined, 'top');
    closeContextMenu();
  }, [card.instanceId, moveCard, closeContextMenu]);

  const handleToBottomOfLibrary = useCallback(() => {
    moveCard(card.instanceId, 'hand', 'library', undefined, 'bottom');
    closeContextMenu();
  }, [card.instanceId, moveCard, closeContextMenu]);

  const handleDiscard = useCallback(() => {
    moveCard(card.instanceId, 'hand', 'graveyard');
    closeContextMenu();
  }, [card.instanceId, moveCard, closeContextMenu]);

  const handleTakeControl = useCallback(() => {
    if (ownerId) {
      takeControl(card.instanceId, ownerId);
    }
    closeContextMenu();
  }, [card.instanceId, ownerId, takeControl, closeContextMenu]);

  const handleEdit = useCallback(() => {
    if (onEditCard) {
      onEditCard(boardCard);
    }
    closeContextMenu();
  }, [boardCard, onEditCard, closeContextMenu]);

  const handleStartAttach = useCallback(() => {
    setAttachingCardId(card.instanceId);
    closeContextMenu();
  }, [card.instanceId, setAttachingCardId, closeContextMenu]);

  const handleDetach = useCallback(() => {
    detachCard(card.instanceId);
    closeContextMenu();
  }, [card.instanceId, detachCard, closeContextMenu]);

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  const imageUrl = showBack
    ? '/mtg-card-back.jpg'
    : card.imageUrl || card.card?.imageUris?.normal || '';

  // Build context menu options
  const contextMenuOptions: MenuOption[] = [
    { label: 'Preview', icon: 'preview', onClick: handlePreview },
  ];

  // Add tap/untap, edit, and graveyard options for battlefield cards (own cards only, not in readOnly mode)
  // Don't show these options if allowTakeControl is true (means we're viewing opponent's cards in popout)
  if (isBattlefield && !isOpponent && !readOnly && !allowTakeControl) {
    contextMenuOptions.push({
      label: isTapped ? 'Untap' : 'Tap',
      icon: isTapped ? 'untap' : 'tap',
      onClick: handleTap,
    });
    if (onEditCard) {
      contextMenuOptions.push({
        label: 'Edit Card',
        icon: 'edit',
        onClick: handleEdit,
      });
    }
    contextMenuOptions.push({
      label: 'Graveyard',
      icon: 'destroy',
      onClick: handleGoToGraveyard,
    });
    contextMenuOptions.push({
      label: 'Exile',
      icon: 'exile',
      onClick: handleGoToExile,
    });

    // Add Attach/Detach options for Equipment and Auras
    if (canAttach(card)) {
      if (boardCard.attachedTo) {
        contextMenuOptions.push({
          label: 'Detach',
          icon: 'detach',
          onClick: handleDetach,
        });
      } else {
        contextMenuOptions.push({
          label: 'Attach',
          icon: 'attach',
          onClick: handleStartAttach,
        });
      }
    }
  }

  // Add "Take Control" option for opponent battlefield cards
  // Shows when viewing opponent's battlefield (isOpponent) or when explicitly allowed (allowTakeControl for popout)
  if (isBattlefield && (isOpponent || allowTakeControl) && ownerId) {
    contextMenuOptions.push({
      label: 'Take Control',
      icon: 'steal',
      onClick: handleTakeControl,
    });
  }

  // Add hand-specific options (own cards only)
  if (isHand && !isOpponent && !readOnly) {
    contextMenuOptions.push({
      label: 'To Top of Library',
      icon: 'toTop',
      onClick: handleToTopOfLibrary,
    });
    contextMenuOptions.push({
      label: 'To Bottom of Library',
      icon: 'toBottom',
      onClick: handleToBottomOfLibrary,
    });
    contextMenuOptions.push({
      label: 'Discard',
      icon: 'destroy',
      onClick: handleDiscard,
    });
  }

  const handlePointerEnter = useCallback(() => {
    // Don't update hover state during drag
    if (isDragging) return;
    setHoveredCard(card, zone);
    if (showHoverEffects) {
      setIsHovered(true);
      // Capture the card's position for the portal
      if (cardRef.current) {
        setHoverRect(cardRef.current.getBoundingClientRect());
      }
    }
  }, [card, zone, showHoverEffects, isDragging]);

  const handlePointerLeave = useCallback(() => {
    // Don't update hover state during drag
    if (isDragging) return;
    clearHoveredCard(card);
    setIsHovered(false);
    setHoverRect(null);
  }, [card, isDragging]);

  // Check if this card is a valid attach target (in attach mode and not the attaching card itself)
  const isValidAttachTarget = attachingCardId && isBattlefield && attachingCardId !== card.instanceId;
  // Check if this card is currently being selected for attachment
  const isAttaching = attachingCardId === card.instanceId;
  // Check if this card is attached to something
  const isAttached = isBattlefield && boardCard.attachedTo;

  return (
    <>
      <div
        ref={cardRef}
        className="h-full relative"
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`card-container relative cursor-pointer select-none shadow-xl ${isDragging ? 'opacity-0' : ''} ${isHovered && showHoverEffects && !isDragging && hoverRect ? 'opacity-0' : ''}`}
          animate={{
            rotate: isTapped ? 90 : 0,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {/* Attach mode target highlight */}
          {isValidAttachTarget && (
            <div className="absolute inset-0 rounded ring-4 ring-cyan-400 ring-opacity-80 animate-pulse z-10 pointer-events-none" />
          )}
          {/* Attaching card highlight (the card being attached) */}
          {isAttaching && (
            <div className="absolute inset-0 rounded ring-4 ring-amber-400 ring-opacity-80 animate-pulse z-10 pointer-events-none" />
          )}
          {/* Attached indicator */}
          {isAttached && (
            <div
              className="absolute -top-1 -left-1 text-[10px] font-bold px-1 rounded z-10"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-text-primary)',
                boxShadow: '0 0 8px var(--theme-accent), 0 0 16px var(--theme-accent), 0 0 24px var(--theme-accent)',
              }}
            >
              ⛓
            </div>
          )}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={card.cardName}
              fill
              className="object-cover rounded"
              draggable={false}
              sizes="200px"
              quality={90}
            />
          ) : (
            <div className="w-full h-full rounded flex items-center justify-center p-1" style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}>
              <span className="text-xs text-center break-words" style={{ color: 'var(--theme-text-muted)' }}>
                {card.cardName}
              </span>
            </div>
          )}

          {/* Counters display (top-right) */}
          {isBattlefield && boardCard.counters > 0 && (
            <div className="absolute top-1 right-1 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
              {boardCard.counters}
            </div>
          )}

          {/* Power/Toughness display (bottom-right) - only if modified */}
          {isBattlefield && (boardCard.modifiedPower !== undefined && boardCard.modifiedPower !== 0 || boardCard.modifiedToughness !== undefined && boardCard.modifiedToughness !== 0) && (() => {
            const basePower = parseInt(card.card?.power || '0') || 0;
            const baseToughness = parseInt(card.card?.toughness || '0') || 0;
            const currentPower = basePower + (boardCard.modifiedPower || 0);
            const currentToughness = baseToughness + (boardCard.modifiedToughness || 0);
            const powerChanged = boardCard.modifiedPower !== 0;
            const toughnessChanged = boardCard.modifiedToughness !== 0;
            return (
              <div className="absolute bottom-1 right-1 bg-gray-900/90 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-md">
                <span className={powerChanged ? (boardCard.modifiedPower! > 0 ? 'text-green-400' : 'text-red-400') : ''}>
                  {currentPower}
                </span>
                <span className="text-gray-400">/</span>
                <span className={toughnessChanged ? (boardCard.modifiedToughness! > 0 ? 'text-green-400' : 'text-red-400') : ''}>
                  {currentToughness}
                </span>
              </div>
            );
          })()}

          {/* Copy indicator (center) */}
          {isBattlefield && boardCard.isCopy && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-purple-600/80 text-white text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                Copy
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <CardContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        options={contextMenuOptions}
        onClose={closeContextMenu}
      />

      {/* Portal-based hover effect - escapes all container overflow */}
      {mounted && showHoverEffects && isHovered && !isDragging && hoverRect && createPortal(
        <AnimatePresence>
          <motion.div
            className="pointer-events-none"
            style={{
              position: 'fixed',
              zIndex: 9998,
            }}
            initial={{
              left: hoverRect.left,
              top: hoverRect.top,
              width: hoverRect.width,
              height: hoverRect.height,
              rotate: isTapped ? 90 : 0,
            }}
            animate={{
              left: hoverRect.left + hoverRect.width / 2 - (hoverRect.width * 1.5) / 2,
              top: hoverRect.top + hoverRect.height / 2 - (hoverRect.height * 1.5) / 2,
              width: hoverRect.width * 1.5,
              height: hoverRect.height * 1.5,
              rotate: isTapped ? 90 : 0,
            }}
            exit={{
              left: hoverRect.left,
              top: hoverRect.top,
              width: hoverRect.width,
              height: hoverRect.height,
              rotate: isTapped ? 90 : 0,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* Glow effect */}
            <div className="card-glow-effect" />

            {/* Particles */}
            <div className="card-glow-particles">
              <div className="card-glow-particle particle-left" />
              <div className="card-glow-particle particle-left" />
              <div className="card-glow-particle particle-left" />
              <div className="card-glow-particle particle-left" />
              <div className="card-glow-particle particle-left" />
              <div className="card-glow-particle particle-right" />
              <div className="card-glow-particle particle-right" />
              <div className="card-glow-particle particle-right" />
              <div className="card-glow-particle particle-right" />
              <div className="card-glow-particle particle-right" />
              <div className="card-glow-particle particle-top" />
              <div className="card-glow-particle particle-top" />
              <div className="card-glow-particle particle-top" />
              <div className="card-glow-particle particle-top" />
              <div className="card-glow-particle particle-bottom" />
              <div className="card-glow-particle particle-bottom" />
              <div className="card-glow-particle particle-bottom" />
              <div className="card-glow-particle particle-bottom" />
            </div>

            {/* Card image - rendered at full size, not scaled */}
            <div className="card-container relative">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={card.cardName}
                  fill
                  className="object-cover rounded"
                  draggable={false}
                  sizes="300px"
                  quality={95}
                />
              ) : (
                <div className="w-full h-full rounded flex items-center justify-center p-1" style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}>
                  <span className="text-xs text-center break-words" style={{ color: 'var(--theme-text-muted)' }}>
                    {card.cardName}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// Card back component for library/hidden cards
export function CardBack({ count }: { count?: number }) {
  return (
    <div className="card-container relative rounded overflow-hidden">
      <Image
        src="/mtg-card-back.jpg"
        alt="Card back"
        fill
        className="object-cover"
        draggable={false}
        sizes="80px"
      />
      {count !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="text-2xl font-bold text-white drop-shadow-lg">{count}</span>
        </div>
      )}
    </div>
  );
}

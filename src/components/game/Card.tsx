'use client';

import { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { GameCard, BoardCard, ZoneType } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { CardContextMenu, MenuOption } from './CardContextMenu';
import { setHoveredCard, clearHoveredCard } from './GameBoard';

interface CardProps {
  card: GameCard;
  zone: ZoneType;
  isOpponent?: boolean;
  showBack?: boolean;
  readOnly?: boolean;
  isDragOverlay?: boolean;
  onClick?: () => void;
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

export function Card({
  card,
  zone,
  isOpponent = false,
  showBack = false,
  readOnly = false,
  isDragOverlay = false,
  onClick,
}: CardProps) {
  const { tapCard, setPreviewCard, moveCard, removeCard } = useGameStore();
  const boardCard = card as BoardCard;
  const isTapped = boardCard.tapped;
  const isBattlefield = zone === 'battlefield';
  const isHand = zone === 'hand';
  const showHoverEffects = isHand || isBattlefield;

  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const { attributes, listeners: dndListeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.instanceId,
    data: { card, zone },
    disabled: isOpponent || readOnly || isDragOverlay,
  });

  // Merge our pointer handlers with dnd-kit's listeners
  const listeners = {
    ...dndListeners,
    onPointerMove: (e: React.PointerEvent) => {
      setHoveredCard(card, zone);
      if (showHoverEffects) {
        setIsHovered(true);
      }
      dndListeners?.onPointerMove?.(e);
    },
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isBattlefield && !isOpponent && !readOnly) {
      tapCard(card.instanceId);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

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
    if (isToken(card)) {
      // Tokens are removed from the game when they would go to graveyard
      removeCard(card.instanceId, 'battlefield');
    } else {
      // Regular cards go to graveyard
      moveCard(card.instanceId, 'battlefield', 'graveyard');
    }
  }, [card, moveCard, removeCard]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const imageUrl = showBack
    ? '/card-back.png'
    : card.imageUrl || card.card?.imageUris?.normal || '';

  // Build context menu options
  const contextMenuOptions: MenuOption[] = [
    { label: 'Preview', icon: 'preview', onClick: handlePreview },
  ];

  // Add tap/untap option for battlefield cards (own cards only, not in readOnly mode)
  if (isBattlefield && !isOpponent && !readOnly) {
    contextMenuOptions.push({
      label: isTapped ? 'Untap' : 'Tap',
      icon: isTapped ? 'untap' : 'tap',
      onClick: handleTap,
    });
    contextMenuOptions.push({
      label: 'Graveyard',
      icon: 'destroy',
      onClick: handleGoToGraveyard,
    });
  }

  const handlePointerEnter = useCallback(() => {
    setHoveredCard(card, zone);
    if (showHoverEffects) {
      setIsHovered(true);
    }
  }, [card, zone, showHoverEffects]);

  const handlePointerLeave = useCallback(() => {
    clearHoveredCard(card);
    setIsHovered(false);
  }, [card]);

  return (
    <>
      <div
        className="h-full"
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
          className={`card-container card-sparkle-border relative cursor-pointer select-none ${isHovered && showHoverEffects ? 'sparkle-active' : ''} ${isDragging ? 'opacity-0' : ''}`}
          animate={{
            rotate: isTapped ? 90 : 0,
            scale: isHovered && showHoverEffects ? 1.08 : 1,
          }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
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
            <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center p-1">
              <span className="text-xs text-center text-gray-400 break-words">
                {card.cardName}
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

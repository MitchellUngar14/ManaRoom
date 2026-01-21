'use client';

import { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { GameCard, BoardCard, ZoneType } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { CardContextMenu } from './CardContextMenu';
import { setHoveredCard, clearHoveredCard } from './GameBoard';

interface CardProps {
  card: GameCard;
  zone: ZoneType;
  isOpponent?: boolean;
  isDragging?: boolean;
  showBack?: boolean;
  onClick?: () => void;
}

export function Card({
  card,
  zone,
  isOpponent = false,
  isDragging = false,
  showBack = false,
  onClick,
}: CardProps) {
  const { tapCard, setPreviewCard } = useGameStore();
  const boardCard = card as BoardCard;
  const isTapped = boardCard.tapped;
  const isBattlefield = zone === 'battlefield';

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.instanceId,
    data: { card, zone },
    disabled: isOpponent,
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isBattlefield && !isOpponent) {
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

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const imageUrl = showBack
    ? '/card-back.png'
    : card.imageUrl || card.card?.imageUris?.normal || '';

  const contextMenuOptions = [
    { label: 'Preview', icon: 'preview' as const, onClick: handlePreview },
  ];

  return (
    <>
      <div
        className="h-full"
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => setHoveredCard(card)}
        onPointerLeave={() => clearHoveredCard(card)}
      >
        <motion.div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`card-container relative cursor-pointer select-none ${
            isDragging ? 'opacity-50' : ''
          }`}
          animate={{ rotate: isTapped ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onPointerEnter={() => setHoveredCard(card)}
          onPointerMove={() => setHoveredCard(card)}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={card.cardName}
              fill
              className="object-cover rounded"
              draggable={false}
              sizes="(max-width: 768px) 80px, 120px"
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

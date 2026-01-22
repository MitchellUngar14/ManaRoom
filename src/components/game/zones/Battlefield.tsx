'use client';

import type { GameCard, BoardCard } from '@/types';
import { Card } from '../Card';

interface BattlefieldProps {
  cards: GameCard[];
  isOpponent: boolean;
  ownerId?: string;
  allowTakeControl?: boolean;
  mirrorCards?: boolean;
  readOnly?: boolean;
  fullScreen?: boolean;
  largeCards?: boolean;
  onEditCard?: (card: BoardCard) => void;
}

export function Battlefield({ cards, isOpponent, ownerId, allowTakeControl = false, mirrorCards = false, readOnly = false, fullScreen = false, largeCards = false, onEditCard }: BattlefieldProps) {
  // Card width class based on size
  const cardWidthClass = largeCards ? 'w-40' : 'w-28';

  return (
    <div
      className={`h-full relative overflow-hidden transition-colors duration-500 ${fullScreen ? 'min-h-screen' : ''}`}
      style={{ backgroundColor: 'var(--theme-bg-secondary)', opacity: 0.9 }}
    >
      {/* Cards on battlefield */}
      <div className="absolute inset-0 p-2">
        {cards.map((card) => {
          const boardCard = card as BoardCard;
          // For opponent cards: only mirror Y so cards near opponent appear near the divider
          // Keep X the same so left stays left and right stays right
          const displayX = boardCard.position?.x ?? 0.5;
          const displayY = isOpponent ? (1 - (boardCard.position?.y ?? 0.5)) : (boardCard.position?.y ?? 0.5);
          return (
            <div
              key={card.instanceId}
              className={`${cardWidthClass} absolute ${mirrorCards ? 'rotate-180' : ''}`}
              style={{
                left: `${displayX * 100}%`,
                top: `${displayY * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Card card={card} zone="battlefield" isOpponent={isOpponent} ownerId={ownerId} allowTakeControl={allowTakeControl} readOnly={readOnly} onEditCard={onEditCard} />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm transition-colors duration-500" style={{ color: 'var(--theme-text-secondary)' }}>Battlefield</span>
        </div>
      )}
    </div>
  );
}

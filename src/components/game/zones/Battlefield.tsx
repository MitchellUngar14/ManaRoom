'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameCard, BoardCard } from '@/types';
import { Card } from '../Card';
import { CardEntryEffect } from '../CardEntryEffect';
import { useTheme } from '@/hooks/useTheme';

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
  showPlacementGuides?: boolean;
  showEntryEffects?: boolean;
  scale?: number;
  draggingCardId?: string;
  draggingPosition?: { x: number; y: number } | null;
  showBackground?: boolean;
}

interface EntryEffect {
  id: string;
  x: number;
  y: number;
}

export function Battlefield({ cards, isOpponent, ownerId, allowTakeControl = false, mirrorCards = false, readOnly = false, fullScreen = false, largeCards = false, onEditCard, showPlacementGuides = false, showEntryEffects, scale = 1.0, draggingCardId, draggingPosition, showBackground = true }: BattlefieldProps) {
  const { theme } = useTheme();

  // Track cards we've seen to detect new entries
  const seenCardsRef = useRef<Set<string>>(new Set());
  const [entryEffects, setEntryEffects] = useState<EntryEffect[]>([]);

  // Determine if entry effects should be shown (defaults to isOpponent if not specified)
  const shouldShowEntryEffects = showEntryEffects ?? isOpponent;

  // Detect new cards added to battlefield and cards removed
  useEffect(() => {
    const currentCardIds = new Set(cards.map(c => c.instanceId));

    // Remove cards from seen set that are no longer on battlefield
    // This allows them to trigger the animation again if re-added
    seenCardsRef.current.forEach(id => {
      if (!currentCardIds.has(id)) {
        seenCardsRef.current.delete(id);
      }
    });

    // Only show effects if enabled
    if (!shouldShowEntryEffects) {
      // Still track cards so we don't show effects if they somehow appear later
      cards.forEach(card => seenCardsRef.current.add(card.instanceId));
      return;
    }

    const newEffects: EntryEffect[] = [];

    cards.forEach(card => {
      if (!seenCardsRef.current.has(card.instanceId)) {
        // New card detected!
        seenCardsRef.current.add(card.instanceId);
        const boardCard = card as BoardCard;
        const displayX = boardCard.position?.x ?? 0.5;
        // Only mirror Y when showing opponent's battlefield in main view (isOpponent=true)
        // In popout view (isOpponent=false, showEntryEffects=true), don't mirror
        const displayY = isOpponent
          ? 1 - (boardCard.position?.y ?? 0.5)
          : (boardCard.position?.y ?? 0.5);

        newEffects.push({
          id: card.instanceId,
          x: displayX,
          y: displayY,
        });
      }
    });

    if (newEffects.length > 0) {
      setEntryEffects(prev => [...prev, ...newEffects]);
    }
  }, [cards, shouldShowEntryEffects]);

  const handleEffectComplete = useCallback((id: string) => {
    setEntryEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);
  // Card width class based on size - scale adjusts the actual size
  const baseWidth = largeCards ? 160 : 112; // w-40 = 160px, w-28 = 112px
  const scaledWidth = baseWidth * scale;

  return (
    <div
      className={`h-full relative overflow-hidden transition-colors duration-500 game-battlefield ${fullScreen ? 'min-h-screen' : ''}`}
      style={theme?.playmat?.enabled ? { background: 'transparent' } : undefined}
    >
      {/* Background layer - playmat or tiled texture */}
      {theme?.playmat?.enabled ? (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: `url(${isOpponent ? theme.playmat.opponentImage : theme.playmat.playerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : showBackground && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: 'url(/battlefield-background.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            transform: isOpponent ? 'scaleY(-1)' : 'none',
          }}
        />
      )}
      {/* Placement guides - only shown for player's battlefield */}
      {showPlacementGuides && !isOpponent && (
        <div className="absolute inset-0 flex pointer-events-none z-[2]">
          {/* Creatures zone - left third */}
          <div className="flex-1 border-r flex flex-col items-center justify-center" style={{ borderColor: 'var(--theme-border-subtle)' }}>
            <div className="flex flex-col items-center gap-2 magical-rune-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="magical-rune-icon"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="magical-rune-text" style={{ animationDelay: '0s' }}>Creatures</span>
            </div>
          </div>

          {/* Permanents zone - middle third */}
          <div className="flex-1 border-r flex flex-col items-center justify-center" style={{ borderColor: 'var(--theme-border-subtle)' }}>
            <div className="flex flex-col items-center gap-2 magical-rune-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="magical-rune-icon"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="magical-rune-text" style={{ animationDelay: '0.7s' }}>Permanents</span>
            </div>
          </div>

          {/* Lands zone - right third */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-2 magical-rune-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="magical-rune-icon"
              >
                <path d="M2 22L12 12 22 22" />
                <path d="M12 12L7 7" />
                <path d="M12 12L17 7" />
                <circle cx="7" cy="7" r="2" />
                <circle cx="17" cy="7" r="2" />
              </svg>
              <span className="magical-rune-text" style={{ animationDelay: '1.4s' }}>Lands</span>
            </div>
          </div>
        </div>
      )}

      {/* Cards on battlefield */}
      <div className="absolute inset-0 p-2">
        {(() => {
          // Separate cards into base cards (not attached) and attached cards
          const baseCards = cards.filter((card) => !(card as BoardCard).attachedTo);
          const attachedCards = cards.filter((card) => (card as BoardCard).attachedTo);

          // Build a map of targetId -> attached cards for efficient lookup
          const attachmentsMap = new Map<string, BoardCard[]>();
          attachedCards.forEach((card) => {
            const boardCard = card as BoardCard;
            const targetId = boardCard.attachedTo!;
            if (!attachmentsMap.has(targetId)) {
              attachmentsMap.set(targetId, []);
            }
            attachmentsMap.get(targetId)!.push(boardCard);
          });

          // Render all cards - base cards first, then attached cards positioned relative to targets
          const renderedCards: React.ReactNode[] = [];

          // Render base cards
          baseCards.forEach((card) => {
            const boardCard = card as BoardCard;
            // Use dragging position if this card is being dragged
            const isDragging = card.instanceId === draggingCardId;
            const baseX = isDragging && draggingPosition ? draggingPosition.x : (boardCard.position?.x ?? 0.5);
            const baseY = isDragging && draggingPosition ? draggingPosition.y : (boardCard.position?.y ?? 0.5);
            const displayX = baseX;
            const displayY = isOpponent ? (1 - baseY) : baseY;
            const zIndex = Math.floor(displayY * 40);

            renderedCards.push(
              <div
                key={card.instanceId}
                className={`absolute ${mirrorCards ? 'rotate-180' : ''}`}
                style={{
                  left: `${displayX * 100}%`,
                  top: `${displayY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${scaledWidth}px`,
                  zIndex,
                }}
              >
                <Card card={card} zone="battlefield" isOpponent={isOpponent} ownerId={ownerId} allowTakeControl={allowTakeControl} readOnly={readOnly} onEditCard={onEditCard} />
              </div>
            );

            // Render any cards attached to this base card
            const attachments = attachmentsMap.get(card.instanceId) || [];
            attachments.forEach((attachedCard, attachIndex) => {
              // Position attachments slightly offset from the base card (bottom-right)
              // Stack them diagonally with each attachment offset more
              const offsetY = 0.06 * (attachIndex + 1); // Stack downward
              const offsetX = 0.03 * (attachIndex + 1); // Right offset for visibility
              const attachedDisplayX = displayX + offsetX;
              const attachedDisplayY = displayY + offsetY;
              // Attached cards render above their target
              const attachedZIndex = zIndex + 1 + attachIndex;

              renderedCards.push(
                <div
                  key={attachedCard.instanceId}
                  className={`absolute ${mirrorCards ? 'rotate-180' : ''} ${isDragging ? 'transition-none' : ''}`}
                  style={{
                    left: `${attachedDisplayX * 100}%`,
                    top: `${attachedDisplayY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${scaledWidth}px`,
                    zIndex: attachedZIndex,
                  }}
                >
                  <Card card={attachedCard} zone="battlefield" isOpponent={isOpponent} ownerId={ownerId} allowTakeControl={allowTakeControl} readOnly={readOnly} onEditCard={onEditCard} />
                </div>
              );
            });
          });

          // Render any orphaned attached cards (target no longer exists)
          // These render at their own position
          attachedCards.forEach((card) => {
            const boardCard = card as BoardCard;
            const targetExists = baseCards.some(c => c.instanceId === boardCard.attachedTo);
            if (!targetExists) {
              const displayX = boardCard.position?.x ?? 0.5;
              const displayY = isOpponent ? (1 - (boardCard.position?.y ?? 0.5)) : (boardCard.position?.y ?? 0.5);
              const zIndex = Math.floor(displayY * 40);

              renderedCards.push(
                <div
                  key={card.instanceId}
                  className={`absolute ${mirrorCards ? 'rotate-180' : ''}`}
                  style={{
                    left: `${displayX * 100}%`,
                    top: `${displayY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${scaledWidth}px`,
                    zIndex,
                  }}
                >
                  <Card card={card} zone="battlefield" isOpponent={isOpponent} ownerId={ownerId} allowTakeControl={allowTakeControl} readOnly={readOnly} onEditCard={onEditCard} />
                </div>
              );
            }
          });

          return renderedCards;
        })()}
      </div>

      {/* Entry effects for new opponent cards */}
      {entryEffects.map(effect => (
        <CardEntryEffect
          key={effect.id}
          x={effect.x}
          y={effect.y}
          onComplete={() => handleEffectComplete(effect.id)}
        />
      ))}

    </div>
  );
}

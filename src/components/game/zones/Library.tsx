'use client';

import type { GameCard } from '@/types';
import { CardBack } from '../Card';
import { useGameStore } from '@/store/gameStore';

interface LibraryProps {
  cards: GameCard[];
  isOpponent: boolean;
}

export function Library({ cards, isOpponent }: LibraryProps) {
  const { drawCard } = useGameStore();

  const handleClick = () => {
    if (!isOpponent && cards.length > 0) {
      drawCard();
    }
  };

  return (
    <div
      className="h-full bg-gray-800/50 rounded-lg p-1 flex items-center justify-center cursor-pointer hover:bg-gray-700/50 transition-colors"
      onClick={handleClick}
      title={isOpponent ? 'Opponent\'s library' : 'Click to draw a card'}
    >
      <div className="w-14">
        <CardBack count={cards.length} />
      </div>
    </div>
  );
}

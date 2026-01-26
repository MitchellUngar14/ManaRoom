'use client';

import { motion } from 'framer-motion';
import type { PlayerState } from '@/types';

interface OpponentThumbnailProps {
  opponent: PlayerState;
  isFocused: boolean;
  onFocus: () => void;
  onPopout: () => void;
}

export function OpponentThumbnail({
  opponent,
  isFocused,
  onFocus,
  onPopout,
}: OpponentThumbnailProps) {
  const battlefieldCardCount = opponent.zones.battlefield.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`opponent-thumbnail ${isFocused ? 'opponent-thumbnail-focused' : ''}`}
      onClick={onFocus}
    >
      {/* Player info */}
      <div className="opponent-thumbnail-header">
        <span className="opponent-thumbnail-name">{opponent.displayName}</span>
        <span className="opponent-thumbnail-life">{opponent.life}</span>
      </div>

      {/* Card counts */}
      <div className="opponent-thumbnail-stats">
        <div className="opponent-thumbnail-stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>{battlefieldCardCount}</span>
        </div>
        <div className="opponent-thumbnail-stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>{opponent.zones.hand.length}</span>
        </div>
      </div>

      {/* Pop out button */}
      <button
        className="opponent-thumbnail-popout"
        onClick={(e) => {
          e.stopPropagation();
          onPopout();
        }}
        title="Pop out to separate window"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>
    </motion.div>
  );
}

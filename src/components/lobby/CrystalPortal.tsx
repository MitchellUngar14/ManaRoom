'use client';

import { useState } from 'react';
import Image from 'next/image';

type PortalMode = 'join' | 'create';

interface CrystalPortalProps {
  selectedDeckId: string | null;
  onJoin: (roomKey: string) => void;
  onCreateRoom: () => void;
}

export function CrystalPortal({ selectedDeckId, onJoin, onCreateRoom }: CrystalPortalProps) {
  const [mode, setMode] = useState<PortalMode>('join');
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const isCreateMode = mode === 'create';

  const handleActivate = async () => {
    if (mode === 'join') {
      if (!roomKey.trim()) {
        setError('Enter a room code');
        return;
      }
    }

    if (!selectedDeckId) {
      setError('Select a grimoire first');
      return;
    }

    setIsActivating(true);

    if (mode === 'create') {
      // Create room flow
      sessionStorage.setItem('selectedDeckId', selectedDeckId);
      sessionStorage.setItem('isRoomCreator', 'true');

      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          sessionStorage.setItem('displayName', authData.user?.displayName || 'Player');
        }
      } catch {
        // Ignore auth errors
      }

      setTimeout(() => {
        onCreateRoom();
      }, 1800);
    } else {
      // Join room flow
      sessionStorage.setItem('selectedDeckId', selectedDeckId);
      sessionStorage.removeItem('isRoomCreator');

      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          sessionStorage.setItem('displayName', authData.user?.displayName || 'Player');
        }
      } catch {
        // Ignore auth errors
      }

      setTimeout(() => {
        onJoin(roomKey.toUpperCase().trim());
      }, 1800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isActivating) {
      handleActivate();
    }
  };

  const switchMode = (direction: 'left' | 'right') => {
    setError(null);
    setMode(prev => prev === 'join' ? 'create' : 'join');
  };

  const hasSelectedDeck = !!selectedDeckId;

  // Crystal image paths based on mode
  const crystalMain = isCreateMode ? '/center-crystal-green.png' : '/center-crystal.png';
  const crystalLarge = isCreateMode ? '/crystal-large-tilted-green.png' : '/crystal-large-tilted.png';
  const crystalSmall = isCreateMode ? '/crystal-small-tilted-green.png' : '/crystal-small-tilted.png';

  return (
    <div className={`crystal-portal ${isActivating ? 'portal-activating' : ''} ${hasSelectedDeck ? 'portal-ready' : ''} ${isCreateMode ? 'portal-create-mode' : 'portal-join-mode'}`}>
      {/* Floating Crystals Container */}
      <div className="crystal-assembly">
        {/* Left side crystals - mirrored */}
        <div className="crystal-side crystal-left">
          <Image
            src={crystalLarge}
            alt=""
            width={80}
            height={100}
            className="crystal-img crystal-large-tilted"
            draggable={false}
          />
          <Image
            src={crystalSmall}
            alt=""
            width={50}
            height={65}
            className="crystal-img crystal-small-lower"
            draggable={false}
          />
        </div>

        {/* Center main crystal */}
        <div className="crystal-center">
          <Image
            src={crystalMain}
            alt="Portal Crystal"
            width={180}
            height={320}
            className="crystal-img crystal-main"
            draggable={false}
            priority
          />
          {/* Crystal glow effect */}
          <div className="crystal-glow" />
          {/* Inner pulse light */}
          <div className="crystal-pulse" />
        </div>

        {/* Right side crystals */}
        <div className="crystal-side crystal-right">
          <Image
            src={crystalLarge}
            alt=""
            width={80}
            height={100}
            className="crystal-img crystal-large-tilted"
            draggable={false}
          />
          <Image
            src={crystalSmall}
            alt=""
            width={50}
            height={65}
            className="crystal-img crystal-small-lower"
            draggable={false}
          />
        </div>
      </div>

      {/* Pedestal with input area */}
      <div className="portal-pedestal-container">
        <div className="pedestal-wrapper">
          {/* Left Arrow */}
          <button
            className="portal-arrow portal-arrow-left"
            onClick={() => switchMode('left')}
            disabled={isActivating}
            aria-label="Previous mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            className="portal-arrow portal-arrow-right"
            onClick={() => switchMode('right')}
            disabled={isActivating}
            aria-label="Next mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <Image
            src="/portal-pedestal.png"
            alt="Portal Pedestal"
            width={500}
            height={280}
            className="pedestal-img"
            draggable={false}
            priority
          />

          {/* Input/Label area */}
          <div className="pedestal-input-area">
            {isCreateMode ? (
              <div className="pedestal-create-label">CREATE</div>
            ) : (
              <input
                type="text"
                value={roomKey}
                onChange={(e) => {
                  setRoomKey(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="ROOM CODE"
                maxLength={6}
                disabled={isActivating}
                className="pedestal-input"
              />
            )}
          </div>

          {/* The activate button area */}
          <button
            onClick={handleActivate}
            disabled={!selectedDeckId || isActivating}
            className="pedestal-activate-btn"
            aria-label="Activate Portal"
          >
            <span className="activate-text">
              {isActivating ? 'Activating...' : 'Activate Portal'}
            </span>
          </button>
        </div>

        {/* Mode indicator dots */}
        <div className="portal-mode-indicator">
          <span className={`mode-dot ${mode === 'join' ? 'active' : ''}`} />
          <span className={`mode-dot ${mode === 'create' ? 'active' : ''}`} />
        </div>

        {/* Error message */}
        {error && (
          <p className="portal-error-message">{error}</p>
        )}
      </div>

      {/* Ambient particles */}
      <div className="crystal-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

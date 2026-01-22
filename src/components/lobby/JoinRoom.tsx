'use client';

import { useState } from 'react';

interface JoinRoomProps {
  selectedDeckId: string | null;
  onJoin: (roomKey: string) => void;
}

export function JoinRoom({ selectedDeckId, onJoin }: JoinRoomProps) {
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleJoin = async () => {
    if (!roomKey.trim()) {
      setError('Enter a room code');
      return;
    }

    if (!selectedDeckId) {
      setError('Select a grimoire first');
      return;
    }

    // Start unlock animation
    setIsUnlocking(true);

    // Store selected deck for the room page (not creator)
    sessionStorage.setItem('selectedDeckId', selectedDeckId);
    sessionStorage.removeItem('isRoomCreator'); // Ensure we're joining, not creating

    // Get display name from auth
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        sessionStorage.setItem('displayName', authData.user?.displayName || 'Player');
      }
    } catch {
      // Ignore auth errors, use default name
    }

    // Wait for door animation then navigate
    setTimeout(() => {
      onJoin(roomKey.toUpperCase().trim());
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUnlocking) {
      handleJoin();
    }
  };

  const hasSelectedDeck = !!selectedDeckId;

  return (
    <div className={`study-gate ${isUnlocking ? 'gate-opening' : ''} ${hasSelectedDeck ? 'gate-ready' : ''}`}>
      {/* Stone archway frame */}
      <div className="gate-arch">
        {/* Rune carvings on arch */}
        <div className="arch-runes arch-runes-left">
          <span>✦</span>
          <span>◈</span>
          <span>✧</span>
        </div>
        <div className="arch-runes arch-runes-right">
          <span>✧</span>
          <span>◈</span>
          <span>✦</span>
        </div>

        {/* Portal inside arch */}
        <div className="gate-portal">
          <div className="portal-mist" />
          <div className="portal-swirl" />
          <div className="portal-glow" />

          {/* Sparkles emanating from portal */}
          <div className="portal-sparkles">
            <div className="sparkle sparkle-1" />
            <div className="sparkle sparkle-2" />
            <div className="sparkle sparkle-3" />
            <div className="sparkle sparkle-4" />
            <div className="sparkle sparkle-5" />
            <div className="sparkle sparkle-6" />
            <div className="sparkle sparkle-7" />
            <div className="sparkle sparkle-8" />
            <div className="sparkle sparkle-9" />
            <div className="sparkle sparkle-10" />
            {/* Extra sparkles shown on hover */}
            <div className="sparkle sparkle-11" />
            <div className="sparkle sparkle-12" />
            <div className="sparkle sparkle-13" />
            <div className="sparkle sparkle-14" />
            <div className="sparkle sparkle-15" />
          </div>
        </div>

        {/* Gate doors */}
        <div className="gate-doors">
          <div className="gate-door gate-door-left" />
          <div className="gate-door gate-door-right" />
        </div>
      </div>

      {/* Input area below archway */}
      <div className="gate-controls">
        <p className="gate-label">Enter Room Code</p>

        {error && (
          <p className="gate-error">{error}</p>
        )}

        <div className="gate-input-group">
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
            disabled={isUnlocking}
            className="gate-input"
          />
          <button
            onClick={handleJoin}
            disabled={!selectedDeckId || isUnlocking}
            className="gate-enter-btn"
          >
            {isUnlocking ? '...' : 'Enter'}
          </button>
        </div>
      </div>
    </div>
  );
}

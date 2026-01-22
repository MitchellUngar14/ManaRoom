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
      setError('Please enter a room code');
      return;
    }

    if (!selectedDeckId) {
      setError('Please select a deck first');
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
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isUnlocking) {
      handleJoin();
    }
  };

  return (
    <div className="arcane-door-container rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-2 text-center text-amber-100 relative z-10">
        The Sealed Gate
      </h2>

      <p className="text-gray-400 mb-4 text-sm text-center relative z-10">
        Speak the arcane code to unseal the passage
      </p>

      {/* Door visualization */}
      <div className="flex justify-center mb-5 relative z-10">
        <div className={`arcane-door-frame ${isUnlocking ? 'unlocking' : ''}`}>
          {/* Portal behind door */}
          <div className="door-portal" />

          {/* Door leaves */}
          <div className="door-leaf door-leaf-left" />
          <div className="door-leaf door-leaf-right" />

          {/* Lock */}
          <div className={`door-lock ${isUnlocking ? 'unlocked' : ''}`}>
            <div className="lock-shackle" />
            <div className="lock-body" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4 backdrop-blur-sm text-center relative z-10">
          {error}
        </div>
      )}

      {/* Code input and unlock button */}
      <div className="flex gap-3 relative z-10">
        <input
          type="text"
          value={roomKey}
          onChange={(e) => {
            setRoomKey(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="RUNE CODE"
          maxLength={6}
          disabled={isUnlocking}
          className="rune-code-input flex-1 px-4 py-3.5 rounded-lg focus:outline-none font-mono text-lg tracking-widest uppercase text-center transition-all disabled:opacity-50"
        />
        <button
          onClick={handleJoin}
          disabled={!selectedDeckId || isUnlocking}
          className="unlock-btn px-6 py-3.5 rounded-lg text-sm"
        >
          {isUnlocking ? '✦' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}

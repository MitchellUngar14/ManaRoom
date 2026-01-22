'use client';

import { useState } from 'react';

interface CreateRoomProps {
  selectedDeckId: string | null;
  onRoomCreated: (roomKey: string) => void;
  disabled: boolean;
}

export function CreateRoom({ selectedDeckId, onRoomCreated, disabled }: CreateRoomProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!selectedDeckId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: selectedDeckId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Store selected deck and creator flag for the room page
      sessionStorage.setItem('selectedDeckId', selectedDeckId);
      sessionStorage.setItem('isRoomCreator', 'true');

      // Get display name from auth
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        sessionStorage.setItem('displayName', authData.user?.displayName || 'Player');
      }

      onRoomCreated(data.roomKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mystical-orb-container">
      {/* The mystical blue orb */}
      <button
        onClick={handleCreate}
        disabled={disabled || loading}
        className={`mystical-orb ${disabled ? 'orb-dormant' : 'orb-active'} ${loading ? 'orb-activating' : ''}`}
      >
        {/* Orb inner glow layers */}
        <div className="orb-core" />
        <div className="orb-swirl" />
        <div className="orb-highlight" />

        {/* Floating runes around orb */}
        <div className="orb-runes">
          <span className="rune rune-1">✦</span>
          <span className="rune rune-2">◇</span>
          <span className="rune rune-3">✧</span>
          <span className="rune rune-4">◆</span>
        </div>
      </button>

      {/* Orb stand/base */}
      <div className="orb-stand">
        <div className="stand-prongs" />
      </div>

      {/* Label and status */}
      <div className="orb-label">
        <p className="text-sm font-medium text-blue-200/90">
          {loading ? 'Opening Portal...' : disabled ? 'Select a Grimoire' : 'Summon Arena'}
        </p>
        <p className="text-xs text-blue-300/50 mt-1">
          {disabled ? 'Choose your deck to activate' : 'Touch the orb to create a room'}
        </p>
      </div>

      {error && (
        <div className="orb-error">
          {error}
        </div>
      )}
    </div>
  );
}

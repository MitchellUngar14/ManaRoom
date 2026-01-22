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
    <div className="summoning-portal rounded-xl p-6">
      {/* Rune decorations */}
      <div className="portal-runes top-3 left-4">✦ ◆ ✦</div>
      <div className="portal-runes top-3 right-4">✦ ◆ ✦</div>

      <h2 className="text-xl font-semibold mb-2 text-center text-purple-200">
        Summon Arena
      </h2>

      <p className="text-gray-400 mb-6 text-sm text-center">
        Step through the portal to create a new battlefield
      </p>

      {/* Portal visualization */}
      <div className="flex justify-center mb-6">
        <div className={`portal-ring ${disabled ? 'opacity-40' : ''}`}>
          <div className="portal-vortex" />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4 backdrop-blur-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={disabled || loading}
        className="portal-enter-btn w-full py-3.5 rounded-lg text-sm"
      >
        {loading ? '✦ Opening Portal... ✦' : disabled ? 'Select a Grimoire' : '✦ Enter the Portal ✦'}
      </button>

      {/* Bottom runes */}
      <div className="portal-runes bottom-3 left-1/2 -translate-x-1/2">◈ ◇ ◈</div>
    </div>
  );
}

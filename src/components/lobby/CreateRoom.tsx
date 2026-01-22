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
    <div className="grimoire-card rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-2 text-amber-100">Summon Arena</h2>

      <p className="text-gray-400 mb-5 text-sm">
        Open a portal to a new battlefield and summon an ally to join you.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4 backdrop-blur-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={disabled || loading}
        className="btn-magical w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium shadow-lg shadow-green-900/30 disabled:shadow-none transition-all"
      >
        {loading ? 'Opening portal...' : disabled ? 'Choose a grimoire first' : 'Open Portal'}
      </button>
    </div>
  );
}

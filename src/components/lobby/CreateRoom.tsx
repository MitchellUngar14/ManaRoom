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

      // Store selected deck for the room page
      sessionStorage.setItem('selectedDeckId', selectedDeckId);
      onRoomCreated(data.roomKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create Room</h2>

      <p className="text-gray-400 mb-4">
        Create a new game room and invite a friend to play.
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={disabled || loading}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded font-medium"
      >
        {loading ? 'Creating...' : disabled ? 'Select a deck first' : 'Create Room'}
      </button>
    </div>
  );
}

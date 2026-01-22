'use client';

import { useState } from 'react';

interface JoinRoomProps {
  selectedDeckId: string | null;
  onJoin: (roomKey: string) => void;
}

export function JoinRoom({ selectedDeckId, onJoin }: JoinRoomProps) {
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!roomKey.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!selectedDeckId) {
      setError('Please select a deck first');
      return;
    }

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

    onJoin(roomKey.toUpperCase().trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="grimoire-card rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-2 text-amber-100">Enter Portal</h2>

      <p className="text-gray-400 mb-5 text-sm">
        Speak the arcane code to enter an existing battlefield.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4 backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <input
          type="text"
          value={roomKey}
          onChange={(e) => {
            setRoomKey(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="PORTAL CODE"
          maxLength={6}
          className="flex-1 px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 font-mono text-lg tracking-widest uppercase text-center transition-all"
        />
        <button
          onClick={handleJoin}
          disabled={!selectedDeckId}
          className="btn-magical px-7 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium shadow-lg shadow-purple-900/30 disabled:shadow-none transition-all"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

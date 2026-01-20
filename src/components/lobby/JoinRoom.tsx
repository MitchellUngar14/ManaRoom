'use client';

import { useState } from 'react';

interface JoinRoomProps {
  selectedDeckId: string | null;
  onJoin: (roomKey: string) => void;
}

export function JoinRoom({ selectedDeckId, onJoin }: JoinRoomProps) {
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    if (!roomKey.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!selectedDeckId) {
      setError('Please select a deck first');
      return;
    }

    // Store selected deck for the room page
    sessionStorage.setItem('selectedDeckId', selectedDeckId);
    onJoin(roomKey.toUpperCase().trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Join Room</h2>

      <p className="text-gray-400 mb-4">
        Enter a room code to join an existing game.
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={roomKey}
          onChange={(e) => {
            setRoomKey(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter room code"
          maxLength={6}
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 font-mono text-lg tracking-wider uppercase"
        />
        <button
          onClick={handleJoin}
          disabled={!selectedDeckId}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded font-medium"
        >
          Join
        </button>
      </div>
    </div>
  );
}

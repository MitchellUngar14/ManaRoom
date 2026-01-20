'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { useGameStore } from '@/store/gameStore';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomKey = params.key as string;

  const {
    connected,
    gameState,
    players,
    connect,
    disconnect,
    joinRoom,
  } = useGameStore();

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Connect to socket
        await connect();

        // Get deck ID from session storage or URL params
        const deckId = sessionStorage.getItem('selectedDeckId');

        if (!deckId) {
          setError('No deck selected. Please go back and select a deck.');
          setJoining(false);
          return;
        }

        // Join the room
        await joinRoom(roomKey, deckId);
        setJoining(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join room');
        setJoining(false);
      }
    };

    init();

    return () => {
      disconnect();
    };
  }, [roomKey, connect, disconnect, joinRoom]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (joining || !connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to room {roomKey}...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    const playerCount = Object.keys(players).length;

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Waiting for Players</h2>
          <p className="text-gray-400 mb-6">
            Share this room code with your opponent:
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <span className="text-3xl font-mono tracking-wider">{roomKey}</span>
          </div>
          <p className="text-gray-500">
            {playerCount} player{playerCount !== 1 ? 's' : ''} in room
          </p>
          <div className="mt-6">
            {Object.values(players).map((player) => (
              <div
                key={player.odId}
                className="flex items-center justify-between py-2 border-b border-gray-800"
              >
                <span>{player.displayName}</span>
                <span className="text-gray-500 text-sm">
                  {player.odeck.commander}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">ManaRoom</h1>
          <span className="text-gray-500">Room: {roomKey}</span>
        </div>
        <GameControls />
      </header>

      {/* Game board */}
      <div className="flex-1 overflow-hidden">
        <GameBoard />
      </div>
    </div>
  );
}

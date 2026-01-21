'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { useGameStore } from '@/store/gameStore';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomKey = params.key as string;
  const initRef = useRef(false);

  const {
    connected,
    gameState,
    players,
    roomKey: actualRoomKey,
    connect,
    disconnect,
    createRoom,
    joinRoom,
  } = useGameStore();

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  // Use actual room key from store, falling back to URL param
  const displayRoomKey = actualRoomKey || roomKey;

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        // Connect to socket
        await connect();

        // Get deck ID and creator flag from session storage
        const deckId = sessionStorage.getItem('selectedDeckId');
        const isCreator = sessionStorage.getItem('isRoomCreator') === 'true';
        const displayName = sessionStorage.getItem('displayName') || 'Player';

        // Clear the creator flag
        sessionStorage.removeItem('isRoomCreator');

        if (!deckId) {
          setError('No deck selected. Please go back and select a deck.');
          setJoining(false);
          return;
        }

        // Fetch deck data from API
        const deckRes = await fetch(`/api/decks/${deckId}`);
        if (!deckRes.ok) {
          throw new Error('Failed to load deck');
        }
        const { deck } = await deckRes.json();

        // Transform deck data for socket server
        const deckData = {
          commander: {
            name: deck.commander,
            scryfallId: deck.cardList?.commander?.scryfallId || '',
            imageUrl: deck.cardList?.commander?.imageUrl || '',
          },
          cards: deck.cardList?.cards || [],
        };

        if (isCreator) {
          // Create the room on the socket server - returns actual room key
          await createRoom(deckId, deckData, displayName);
          // Note: The actual room key is stored in the gameStore and displayed via displayRoomKey
          // We don't redirect because that would cause a re-mount and re-initialization
        } else {
          // Join existing room using URL's room key
          await joinRoom(roomKey, deckId, deckData, displayName);
        }

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
  }, [roomKey, router, connect, disconnect, createRoom, joinRoom]);

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
          <p className="text-gray-400">Connecting to room {displayRoomKey}...</p>
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
            <span className="text-3xl font-mono tracking-wider">{displayRoomKey}</span>
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
          <span className="text-gray-500">Room: {displayRoomKey}</span>
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

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { LifeCounter } from '@/components/game/LifeCounter';
import { ThemeSelector } from '@/components/game/ThemeSelector';
import { useGameStore } from '@/store/gameStore';
import { useTheme } from '@/hooks/useTheme';

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
    rejoinRoom,
  } = useGameStore();

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

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

        // Check if we have an existing player ID for this room (reconnection case)
        const existingPlayerId = sessionStorage.getItem(`playerId_${roomKey.toUpperCase()}`);

        if (existingPlayerId) {
          // Try to rejoin with existing player ID
          const rejoined = await rejoinRoom(roomKey, existingPlayerId);
          if (rejoined) {
            console.log('Successfully rejoined room');
            setJoining(false);
            return;
          }
          // Rejoin failed, clear the stored player ID and continue with fresh join
          console.log('Rejoin failed, joining as new player');
          sessionStorage.removeItem(`playerId_${roomKey.toUpperCase()}`);
        }

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

        // Fetch enriched deck data from API (includes full Scryfall card data)
        const deckRes = await fetch(`/api/decks/${deckId}/enrich`);
        if (!deckRes.ok) {
          throw new Error('Failed to load deck');
        }
        const { deck } = await deckRes.json();

        // Get commander from enriched data
        const commander = deck.cardList?.commanders?.[0];

        // Transform deck data for socket server (includes full Card objects)
        const deckData = {
          commander: commander ? {
            name: commander.name,
            scryfallId: commander.scryfallId || '',
            imageUrl: commander.imageUrl || '',
            card: commander.card || null,
          } : {
            name: deck.commander,
            scryfallId: '',
            imageUrl: '',
            card: null,
          },
          cards: (deck.cardList?.cards || []).map((c: { name: string; quantity: number; scryfallId?: string; imageUrl?: string; card?: unknown }) => ({
            name: c.name,
            quantity: c.quantity,
            scryfallId: c.scryfallId || '',
            imageUrl: c.imageUrl || '',
            card: c.card || null,
          })),
        };

        if (isCreator) {
          // Create the room on the socket server - returns actual room key
          const actualRoomKey = await createRoom(deckId, deckData, displayName);
          // Update the URL to match the actual room key without causing a re-mount
          if (actualRoomKey && actualRoomKey !== roomKey) {
            window.history.replaceState(null, '', `/room/${actualRoomKey}`);
          }
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

  const isWaiting = gameState === 'waiting';
  const playerCount = Object.keys(players).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with collapse toggle */}
      <div
        className={`relative shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          headerCollapsed ? 'h-0' : 'h-auto'
        }`}
      >
        <header className="bg-gray-900 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">ManaRoom</h1>
            <span className="text-gray-500 text-sm">Room: {displayRoomKey}</span>
            <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
          </div>
          <LifeCounter />
          <GameControls />
        </header>
      </div>

      {/* Game board */}
      <div className="flex-1 overflow-hidden relative">
        <GameBoard />

        {/* Waiting for opponent overlay */}
        {isWaiting && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div className="bg-gray-900/95 backdrop-blur rounded-lg px-6 py-4 text-center shadow-xl border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">
                  Share this room code with your opponent:
                </p>
                <div className="bg-gray-800 rounded-lg px-4 py-2 mb-2">
                  <span className="text-2xl font-mono tracking-wider">{displayRoomKey}</span>
                </div>
                <p className="text-gray-500 text-xs">
                  {playerCount} player{playerCount !== 1 ? 's' : ''} in room — feel free to experiment with your cards!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle button - positioned at top of game board area */}
        <button
          onClick={() => setHeaderCollapsed(!headerCollapsed)}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-gray-800 hover:bg-gray-700 px-3 py-0.5 rounded-b"
          title={headerCollapsed ? 'Show header' : 'Hide header'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-400 transition-transform duration-300 ${
              headerCollapsed ? 'rotate-180' : ''
            }`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

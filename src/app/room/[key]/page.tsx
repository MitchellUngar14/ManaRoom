'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GameBoard } from '@/components/game/GameBoard';
import { GameControls } from '@/components/game/GameControls';
import { LifeCounter } from '@/components/game/LifeCounter';
import { ThemeSelector } from '@/components/game/ThemeSelector';
import { FancySquareButton } from '@/components/game/FancySquareButton';
import { LogoLoader } from '@/components/ui/LogoLoader';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Fullscreen toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <LogoLoader size="medium" showText={false} />
          <p className="text-gray-400 mt-4">Connecting to room {displayRoomKey}...</p>
        </div>
      </div>
    );
  }

  const isWaiting = gameState === 'waiting';
  const playerCount = Object.keys(players).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header Rail - Fixed at top */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-700 ease-in-out ${
          headerCollapsed ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Rail texture background - flipped so gold trim is at bottom */}
        <div
          className="relative h-12"
          style={{
            backgroundImage: 'url(/rail-texture.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
            transform: 'scaleY(-1)',
          }}
        >
          {/* Inner container flipped back so content is right-side up */}
          <div
            className="absolute inset-0"
            style={{ transform: 'scaleY(-1)' }}
          >
          {/* Left section - Logo and Room */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <h1
              className="font-semibold text-sm"
              style={{
                color: 'var(--theme-accent)',
                textShadow: '0 0 10px var(--theme-accent-glow)',
                fontFamily: 'Cinzel, serif',
              }}
            >
              ManaRoom
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                color: 'var(--theme-text-secondary)',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              Room: {displayRoomKey}
            </span>
            <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
          </div>

          {/* Center section - Life Counter */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LifeCounter />
          </div>

          {/* Right section - Controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <FancySquareButton
              onClick={toggleFullscreen}
              cutoutImage={isFullscreen ? '/ExpandInCutout.png' : '/ExpandOutCutout.png'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            />
            <GameControls />
          </div>

          {/* Center Jewel Toggle - Below the rail */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-50 flex justify-center items-center pointer-events-auto"
            style={{
              bottom: '-40px',
              width: '64px',
              height: '64px',
            }}
          >
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="w-full h-full focus:outline-none filter hover:brightness-125 transition-all active:scale-95 group relative"
              title={headerCollapsed ? 'Show header' : 'Hide header'}
            >
              <motion.div
                className="w-full h-full relative flex items-center justify-center"
                animate={{
                  rotate: headerCollapsed ? 45 : 225,
                }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {/* Diamond Container */}
                <div
                  className="w-10 h-10 relative transform bg-black shadow-lg overflow-hidden"
                  style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                >
                  <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <img
                    src="/jewel-icon.png"
                    alt="Toggle"
                    className="w-full h-full object-cover"
                    style={{ transform: 'rotate(-45deg) scale(1.4)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white opacity-10 pointer-events-none" />
                </div>
              </motion.div>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div
        className={`shrink-0 transition-all duration-700 ease-in-out ${
          headerCollapsed ? 'h-0' : 'h-12'
        }`}
      />

      {/* Game board */}
      <div className="flex-1 overflow-hidden relative">
        <GameBoard />

        {/* Waiting for opponent overlay */}
        {isWaiting && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div
                className="rounded-lg px-6 py-4 text-center shadow-xl"
                style={{
                  background: 'var(--theme-bg-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  Share this room code with your opponent:
                </p>
                <div
                  className="rounded-lg px-4 py-2 mb-2"
                  style={{ background: 'var(--theme-bg-elevated)' }}
                >
                  <span
                    className="text-2xl font-mono tracking-wider"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    {displayRoomKey}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {playerCount} player{playerCount !== 1 ? 's' : ''} in room — feel free to experiment with your cards!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

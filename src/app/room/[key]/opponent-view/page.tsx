'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useTheme } from '@/hooks/useTheme';
import { OpponentBattlefieldPopout } from '@/components/game/OpponentBattlefieldPopout';

export default function OpponentViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomKey = params.key as string;
  const initRef = useRef(false);

  // Apply theme to this window
  useTheme();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opponentId, setOpponentId] = useState<string | null>(null);

  const {
    connected,
    players,
    spectatorMode,
    connect,
    connectAsSpectator,
    disconnect,
  } = useGameStore();

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        // Get opponent ID - check URL params first, then sessionStorage
        // URL params are more reliable for multi-opponent popouts
        const urlOpponentId = searchParams.get('opponentId');
        let storedOpponentId = urlOpponentId;
        let storedMyPlayerId: string | null = null;

        if (urlOpponentId) {
          // Multi-opponent mode: use URL param and keyed sessionStorage
          storedMyPlayerId = sessionStorage.getItem(`popout_${urlOpponentId}_myPlayerId`);
        } else {
          // Legacy mode: try old sessionStorage keys
          storedOpponentId = sessionStorage.getItem('popout_opponentId');
          storedMyPlayerId = sessionStorage.getItem('popout_myPlayerId');
        }

        if (!storedOpponentId) {
          setError('No opponent ID found. Please close and reopen from main window.');
          setLoading(false);
          return;
        }

        setOpponentId(storedOpponentId);

        // Connect to socket
        await connect();

        // Connect as spectator to the room, with ability to act as the main player
        await connectAsSpectator(roomKey, storedMyPlayerId || undefined);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setLoading(false);
      }
    };

    init();

    return () => {
      disconnect();
    };
  }, [roomKey, searchParams, connect, connectAsSpectator, disconnect]);

  // Update document title
  useEffect(() => {
    if (opponentId && players[opponentId]) {
      document.title = `${players[opponentId].displayName}'s Battlefield - ManaRoom`;
    }
  }, [opponentId, players]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-battlefield">
        <div className="text-center">
          <div className="game-spinner mx-auto mb-4" />
          <p style={{ color: 'var(--theme-text-secondary)' }}>Connecting to room {roomKey}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-battlefield">
        <div className="rounded-lg p-6 max-w-md text-center" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
          <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>{error}</p>
          <button
            onClick={() => window.close()}
            className="game-btn px-6 py-2"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  if (!connected || !spectatorMode) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-battlefield">
        <div className="text-center">
          <div className="game-spinner mx-auto mb-4" />
          <p style={{ color: 'var(--theme-text-secondary)' }}>Connecting as spectator...</p>
        </div>
      </div>
    );
  }

  const opponent = opponentId ? players[opponentId] : null;

  if (!opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-battlefield">
        <div className="rounded-lg p-6 max-w-md text-center" style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-accent)' }}>Opponent Not Found</h2>
          <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            The opponent may have left the game or the connection was lost.
          </p>
          <button
            onClick={() => window.close()}
            className="game-btn px-6 py-2"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <OpponentBattlefieldPopout
      opponent={opponent}
      roomKey={roomKey}
    />
  );
}

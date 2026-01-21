'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { OpponentBattlefieldPopout } from '@/components/game/OpponentBattlefieldPopout';

export default function OpponentViewPage() {
  const params = useParams();
  const roomKey = params.key as string;
  const initRef = useRef(false);

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
        // Get opponent ID from sessionStorage (set by main window)
        const storedOpponentId = sessionStorage.getItem('popout_opponentId');
        if (!storedOpponentId) {
          setError('No opponent ID found. Please close and reopen from main window.');
          setLoading(false);
          return;
        }

        setOpponentId(storedOpponentId);

        // Connect to socket
        await connect();

        // Connect as spectator to the room
        await connectAsSpectator(roomKey);

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
  }, [roomKey, connect, connectAsSpectator, disconnect]);

  // Update document title
  useEffect(() => {
    if (opponentId && players[opponentId]) {
      document.title = `${players[opponentId].displayName}'s Battlefield - ManaRoom`;
    }
  }, [opponentId, players]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to room {roomKey}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  if (!connected || !spectatorMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting as spectator...</p>
        </div>
      </div>
    );
  }

  const opponent = opponentId ? players[opponentId] : null;

  if (!opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Opponent Not Found</h2>
          <p className="text-gray-300 mb-6">
            The opponent may have left the game or the connection was lost.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded"
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

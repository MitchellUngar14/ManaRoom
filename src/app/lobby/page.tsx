'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeckImporter } from '@/components/deck/DeckImporter';
import { DeckList } from '@/components/deck/DeckList';
import { CreateRoom } from '@/components/lobby/CreateRoom';
import { JoinRoom } from '@/components/lobby/JoinRoom';

interface User {
  userId: string;
  email: string;
  displayName: string;
}

interface SavedDeck {
  id: string;
  name: string;
  commander: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadDecks();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDecks = async () => {
    try {
      const res = await fetch('/api/decks');
      if (res.ok) {
        const data = await res.json();
        setDecks(data.decks || []);
      }
    } catch (error) {
      console.error('Failed to load decks:', error);
    }
  };

  const handleDeckImported = () => {
    setShowImporter(false);
    loadDecks();
  };

  const handleRoomCreated = (roomKey: string) => {
    router.push(`/room/${roomKey}`);
  };

  const handleJoinRoom = (roomKey: string) => {
    router.push(`/room/${roomKey}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">ManaRoom</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                Welcome, {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded"
            >
              Sign In
            </button>
          )}
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column: Decks */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Decks</h2>
                <button
                  onClick={() => setShowImporter(true)}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 rounded"
                >
                  Import Deck
                </button>
              </div>

              {decks.length > 0 ? (
                <DeckList
                  decks={decks}
                  selectedId={selectedDeckId}
                  onSelect={setSelectedDeckId}
                  onDelete={(id) => {
                    setDecks(decks.filter((d) => d.id !== id));
                    if (selectedDeckId === id) setSelectedDeckId(null);
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No decks yet. Import a deck from Moxfield to get started.
                </p>
              )}
            </div>
          </div>

          {/* Right column: Room actions */}
          <div className="space-y-6">
            <CreateRoom
              selectedDeckId={selectedDeckId}
              onRoomCreated={handleRoomCreated}
              disabled={!selectedDeckId}
            />

            <JoinRoom
              selectedDeckId={selectedDeckId}
              onJoin={handleJoinRoom}
            />
          </div>
        </div>

        {/* Deck importer modal */}
        {showImporter && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Import Deck</h2>
                <button
                  onClick={() => setShowImporter(false)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
              <DeckImporter onSuccess={handleDeckImported} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

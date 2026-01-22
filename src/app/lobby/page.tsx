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
      <div className="summoners-hall min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <main className="summoners-hall min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
              Summoner&apos;s Hall
            </h1>
            <p className="text-gray-500 text-sm mt-1">Prepare your deck and enter battle</p>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-amber-200/80">
                Welcome, <span className="font-medium text-amber-100">{user.displayName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-800/80 hover:bg-gray-700/80 rounded-lg border border-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="btn-magical px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg font-medium shadow-lg shadow-purple-900/30 transition-all"
            >
              Sign In
            </button>
          )}
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column: Bookshelf with Grimoires */}
          <div className="space-y-4">
            {/* Bookshelf header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-serif font-semibold etched-text">Your Grimoires</h2>
              <button
                onClick={() => setShowImporter(true)}
                className="btn-magical px-4 py-2 text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg font-medium shadow-lg shadow-amber-900/20 transition-all"
              >
                + Add Grimoire
              </button>
            </div>

            {/* Bookshelf */}
            <div className="bookshelf rounded-lg p-4 pt-5 pb-6 min-h-[200px]">
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
                <div className="h-full flex flex-col items-center justify-center py-8">
                  <p className="etched-text-secondary text-sm">The shelf is empty.</p>
                  <p className="etched-text-secondary text-xs mt-1 opacity-60">Import a grimoire from Moxfield to begin.</p>
                </div>
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="grimoire-card rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-900/30">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-amber-100">Inscribe New Grimoire</h2>
                <button
                  onClick={() => setShowImporter(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
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

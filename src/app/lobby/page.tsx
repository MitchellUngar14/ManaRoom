'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeckImporter } from '@/components/deck/DeckImporter';
import { DeckList } from '@/components/deck/DeckList';
import { DeckViewer } from '@/components/deck/DeckViewer';
import { CrystalPortal } from '@/components/lobby/CrystalPortal';
import { LogoLoader } from '@/components/ui/LogoLoader';

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
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadDecks();

    // Listen for fullscreen changes (e.g., user presses Escape)
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

  const handleCreateRoom = async () => {
    if (!selectedDeckId) return;

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: selectedDeckId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(`/room/${data.roomKey}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="study-room">
        <div className="study-room-interior">
          <div className="flex items-center justify-center h-full">
            <LogoLoader size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="study-room">
      {/* Room interior - now CSS grid layout */}
      <div className="study-room-interior">
        {/* Ambient background */}
        <div className="study-back-wall" />

        {/* Grimoire Library Panel - Left Sidebar */}
        <div className="study-bookshelf-tall">
          {/* Header bar */}
          <div className="bookshelf-title-bar">
            <h2 className="bookshelf-title">{user ? `${user.displayName}'s` : ''} Grimoires</h2>
            <button
              onClick={() => setShowImporter(true)}
              className="bookshelf-add-btn"
              title="Add Grimoire"
            >
              +
            </button>
          </div>

          {/* Scrollable book area */}
          <div className="bookshelf-scroll-area">
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
              <div className="bookshelf-empty">
                <p className="text-sm" style={{ color: 'var(--sanctum-text-muted)' }}>No grimoires yet</p>
                <button
                  onClick={() => setShowImporter(true)}
                  className="text-xs mt-3 underline transition-colors"
                  style={{ color: 'var(--sanctum-gold-muted)' }}
                >
                  Import from Moxfield
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <header className="study-header">
          <div>
            <h1>Arcanist&apos;s Sanctum</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="study-header-btn-icon"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v2a1 1 0 01-2 0V5a3 3 0 013-3h2a1 1 0 010 2H5zm10 0a1 1 0 011-1h2a3 3 0 013 3v2a1 1 0 01-2 0V5a1 1 0 00-1-1h-2a1 1 0 010-2zM5 16a1 1 0 001 1h2a1 1 0 010 2H5a3 3 0 01-3-3v-2a1 1 0 012 0v2zm12 0a1 1 0 01-1 1h-2a1 1 0 010 2h2a3 3 0 003-3v-2a1 1 0 00-2 0v2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm12 0a1 1 0 011 1v3a1 1 0 01-2 0V5h-3a1 1 0 010-2h4zM3 16a1 1 0 011-1h3a1 1 0 010 2H5v-3a1 1 0 00-2 0v4zm12 0a1 1 0 01-1 1h-3a1 1 0 010-2h3v-3a1 1 0 012 0v4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="study-header-btn"
              >
                Leave
              </button>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="study-header-btn study-header-btn-alt"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main content area - horizontal split layout */}
        <div className="study-desk-area">
          <div className="sanctum-split-layout">
            {/* Left: Selected deck preview (Grimoire) */}
            <div className="sanctum-grimoire-section">
              {selectedDeckId ? (() => {
                const selectedDeck = decks.find(d => d.id === selectedDeckId);
                const commanderImageUrl = selectedDeck?.commander
                  ? `https://api.scryfall.com/cards/named?format=image&version=art_crop&exact=${encodeURIComponent(selectedDeck.commander)}`
                  : null;
                return (
                  <div
                    className="grimoire-book"
                    onClick={() => setShowDeckViewer(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowDeckViewer(true)}
                  >
                    {/* Grimoire background image */}
                    <img
                      src="/grimoire.png"
                      alt=""
                      className="grimoire-bg"
                      draggable={false}
                    />

                    {/* Commander art in the window slot */}
                    <div className="grimoire-window">
                      {commanderImageUrl && (
                        <img
                          src={commanderImageUrl}
                          alt={selectedDeck?.commander || 'Commander'}
                          className="grimoire-commander-img"
                          loading="eager"
                        />
                      )}
                    </div>

                    {/* Deck info in the open area */}
                    <div className="grimoire-text-area">
                      <p className="grimoire-deck-name">{selectedDeck?.name}</p>
                      <p className="grimoire-commander-name">{selectedDeck?.commander}</p>
                    </div>

                    {/* Hover glow effect */}
                    <div className="grimoire-glow" />
                  </div>
                );
              })() : (
                <div
                  className="grimoire-book grimoire-empty"
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src="/grimoire.png"
                    alt=""
                    className="grimoire-bg"
                    draggable={false}
                  />
                  <div className="grimoire-window grimoire-window-empty">
                    <span className="grimoire-empty-icon">?</span>
                  </div>
                  <div className="grimoire-text-area">
                    <p className="grimoire-deck-name grimoire-empty-text">Select a Grimoire</p>
                    <p className="grimoire-commander-name grimoire-empty-subtext">Choose from your collection</p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="sanctum-divider" />

            {/* Right: Crystal Portal (Create/Join Room) */}
            <div className="sanctum-portals-section">
              <CrystalPortal
                selectedDeckId={selectedDeckId}
                onJoin={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deck importer modal */}
      {showImporter && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="study-modal rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-serif" style={{ color: 'var(--sanctum-text-primary)' }}>Inscribe New Grimoire</h2>
              <button
                onClick={() => setShowImporter(false)}
                className="text-2xl leading-none transition-colors"
                style={{ color: 'var(--sanctum-text-muted)' }}
              >
                &times;
              </button>
            </div>
            <DeckImporter onSuccess={handleDeckImported} />
          </div>
        </div>
      )}

      {/* Deck viewer modal */}
      {showDeckViewer && selectedDeckId && (
        <DeckViewer
          deckId={selectedDeckId}
          onClose={() => setShowDeckViewer(false)}
        />
      )}
    </main>
  );
}

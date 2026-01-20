'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import type { Card } from '@/types';

interface TokenSearchProps {
  onClose: () => void;
}

export function TokenSearch({ onClose }: TokenSearchProps) {
  const { addToken } = useGameStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/cards/search?q=${encodeURIComponent(query)}&type=token`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.cards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToken = (card: Card) => {
    addToken(
      {
        name: card.name,
        scryfallId: card.id,
        imageUrl: card.imageUris.normal,
      },
      { x: 0.5, y: 0.5 }
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg p-4 max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Search Tokens</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for tokens (e.g., 'soldier', 'treasure')..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {results.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {results.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleAddToken(card)}
                  className="relative aspect-[488/680] rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  {card.imageUris.normal ? (
                    <Image
                      src={card.imageUris.normal}
                      alt={card.name}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center p-2">
                      <span className="text-xs text-center">{card.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {loading
                ? 'Searching...'
                : 'Search for tokens to add to your battlefield'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

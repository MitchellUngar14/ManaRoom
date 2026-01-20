'use client';

import { useState } from 'react';
import { parseMoxfieldText, validateCommanderDeck } from '@/lib/moxfield-parser';

interface DeckImporterProps {
  onSuccess: () => void;
}

interface ParsedDeck {
  name: string;
  commander: string;
  cardCount: number;
  cards: Array<{ name: string; quantity: number }>;
  commanders: Array<{ name: string; quantity: number }>;
  warnings: string[];
}

export function DeckImporter({ onSuccess }: DeckImporterProps) {
  const [deckName, setDeckName] = useState('');
  const [deckText, setDeckText] = useState('');
  const [preview, setPreview] = useState<ParsedDeck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = () => {
    setError(null);
    setPreview(null);

    if (!deckText.trim()) {
      setError('Please paste your deck list');
      return;
    }

    setLoading(true);

    try {
      const { cards, commanders, errors } = parseMoxfieldText(deckText);
      const warnings = [...errors];

      // Validate commander deck
      const validationErrors = validateCommanderDeck(cards, commanders);
      warnings.push(...validationErrors);

      if (commanders.length === 0) {
        setError('No commander found. Add a "// Commander" section or mark with *CMDR*');
        setLoading(false);
        return;
      }

      const commander = commanders[0].name;
      const totalCards =
        cards.reduce((sum, c) => sum + c.quantity, 0) +
        commanders.reduce((sum, c) => sum + c.quantity, 0);

      setPreview({
        name: deckName || `${commander} Deck`,
        commander,
        cardCount: totalCards,
        cards,
        commanders,
        warnings: warnings.filter(
          (w) => !w.includes('100 cards') // Don't show card count warning in preview
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse deck');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preview.name,
          commander: preview.commander,
          cardList: {
            commanders: preview.commanders,
            cards: preview.cards,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save deck');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <>
          <div>
            <label htmlFor="deckName" className="block text-sm text-gray-400 mb-1">
              Deck Name (optional)
            </label>
            <input
              type="text"
              id="deckName"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="My Commander Deck"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="deckText" className="block text-sm text-gray-400 mb-1">
              Deck List (Moxfield format)
            </label>
            <textarea
              id="deckText"
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              placeholder={`// Commander
1 Atraxa, Praetors' Voice

// Mainboard
1 Sol Ring
1 Arcane Signet
...`}
              className="w-full h-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded font-medium"
          >
            {loading ? 'Parsing...' : 'Preview Deck'}
          </button>

          <p className="text-xs text-gray-500">
            Tip: Export your deck from Moxfield using &quot;Export &gt; Text&quot; and paste it here.
          </p>
        </>
      ) : (
        <>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{preview.name}</h3>
            <p className="text-gray-400">
              Commander: <span className="text-white">{preview.commander}</span>
            </p>
            <p className="text-gray-400">
              Total cards: <span className="text-white">{preview.cardCount}</span>
            </p>
          </div>

          {preview.warnings.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 px-4 py-2 rounded text-sm">
              <p className="font-medium mb-1">Warnings:</p>
              <ul className="list-disc list-inside">
                {preview.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setPreview(null)}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed rounded font-medium"
            >
              {saving ? 'Saving...' : 'Save Deck'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

interface Deck {
  id: string;
  name: string;
  commander: string;
}

interface DeckListProps {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DeckList({ decks, selectedId, onSelect, onDelete }: DeckListProps) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  };

  return (
    <div className="space-y-2">
      {decks.map((deck) => (
        <div
          key={deck.id}
          onClick={() => onSelect(deck.id)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedId === deck.id
              ? 'bg-blue-900/50 border border-blue-500'
              : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{deck.name}</h3>
              <p className="text-sm text-gray-400">{deck.commander}</p>
            </div>
            <button
              onClick={(e) => handleDelete(e, deck.id)}
              className="text-gray-500 hover:text-red-400 p-1"
              title="Delete deck"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    <div className="space-y-0">
      {decks.map((deck) => (
        <div key={deck.id} className="shelf-plank">
          <div
            onClick={() => onSelect(deck.id)}
            className={`grimoire-book cursor-pointer ${
              selectedId === deck.id ? 'selected' : ''
            }`}
          >
            {/* Gold embossed inner frame */}
            <div className="grimoire-book-inner">
              <div className="flex justify-between items-center gap-2">
                {/* Book text content */}
                <div className="min-w-0 flex-1">
                  <h3 className={`font-serif font-semibold truncate text-sm ${
                    selectedId === deck.id ? 'etched-text' : 'etched-text-secondary'
                  }`}>
                    {deck.name}
                  </h3>
                  <p className="text-xs truncate mt-1 etched-text-secondary opacity-60 italic">
                    {deck.commander}
                  </p>
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, deck.id)}
                  className="book-delete-btn p-1.5 rounded flex-shrink-0 opacity-60 hover:opacity-100"
                  title="Remove grimoire"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

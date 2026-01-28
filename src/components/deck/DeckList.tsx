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
  onAdd: () => void;
}

// Number of books per shelf
const BOOKS_PER_SHELF = 1;

export function DeckList({ decks, selectedId, onSelect, onDelete, onAdd }: DeckListProps) {
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

  // Group decks into shelves
  const shelves: Deck[][] = [];
  for (let i = 0; i < decks.length; i += BOOKS_PER_SHELF) {
    shelves.push(decks.slice(i, i + BOOKS_PER_SHELF));
  }

  // Ensure at least one shelf exists for visual consistency
  if (shelves.length === 0) {
    shelves.push([]);
  }

  return (
    <div className="bookshelf-shelves">
      {shelves.map((shelfDecks, shelfIndex) => (
        <div key={shelfIndex} className="bookshelf-shelf">
          {/* Books on this shelf */}
          <div className="bookshelf-shelf-books">
            {shelfDecks.map((deck) => (
              <div
                key={deck.id}
                onClick={() => onSelect(deck.id)}
                className={`book-spine ${selectedId === deck.id ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(deck.id)}
              >
                {/* Book spine background image */}
                <img
                  src="/grimoire-spine.png"
                  alt=""
                  className="book-spine-bg"
                  draggable={false}
                />

                {/* Deck info on spine */}
                <div className="book-spine-text">
                  <span className="book-spine-title">{deck.name}</span>
                  <span className="book-spine-commander">{deck.commander}</span>
                </div>

                {/* Selection glow effect */}
                <div className="book-spine-glow" />

                {/* Delete button - appears on hover */}
                <button
                  onClick={(e) => handleDelete(e, deck.id)}
                  className="book-spine-delete"
                  title="Remove grimoire"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
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
            ))}
          </div>

          {/* Shelf image below the books */}
          <img
            src="/bookshelf-shelf-sidebar.png"
            alt=""
            className="bookshelf-shelf-image"
            draggable={false}
          />
        </div>
      ))}

      {/* Add Grimoire slot */}
      <div className="bookshelf-shelf">
        <div className="bookshelf-shelf-books">
          <div
            onClick={onAdd}
            className="book-spine book-spine-add"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          >
            <img
              src="/grimoire-spine.png"
              alt=""
              className="book-spine-bg"
              draggable={false}
            />
            <div className="book-spine-text">
              <span className="book-spine-add-icon">+</span>
              <span className="book-spine-commander">Add Grimoire</span>
            </div>
            <div className="book-spine-glow" />
          </div>
        </div>
        <img
          src="/bookshelf-shelf-sidebar.png"
          alt=""
          className="bookshelf-shelf-image"
          draggable={false}
        />
      </div>
    </div>
  );
}

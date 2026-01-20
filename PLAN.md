# ManaRoom - Implementation Plan

A multiplayer Commander (Magic: The Gathering) game application for playing with friends online.

## Project Overview

**ManaRoom** allows users to:
- Sign in and manage their account
- Import deck lists from Moxfield (text format)
- Create game rooms with shareable room keys
- Join rooms and import their own deck
- Play cards in real-time with opponents
- Drag cards between zones (hand, battlefield, graveyard, exile, library)
- Tap/untap cards (90° rotation visible to all players)
- Shuffle deck, restart game, search for tokens/cards

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | Unified frontend/backend, consistent with existing projects |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Rapid UI development, consistent with workspace |
| Database | Neon PostgreSQL | Serverless, consistent with Apogee/BadAdvice projects |
| ORM | Drizzle ORM | Type-safe queries, consistent with Apogee |
| Auth | JWT (custom) | Lightweight, consistent with BadAdviceForFree |
| Real-time | Socket.io | Bidirectional WebSocket with fallback |
| State | Zustand | Lightweight, perfect for real-time game state |
| Drag & Drop | @dnd-kit/core | Robust multi-zone drag handling |
| Card Data | Scryfall API | Free, comprehensive MTG card database |

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │   Zustand   │  │    Socket.io        │  │
│  │   App       │  │   Store     │  │    Client           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Routes │  │  Socket.io  │  │   Game State        │  │
│  │  (REST)     │  │  Server     │  │   (In-Memory)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │   Redis     │  │   Scryfall API      │  │
│  │  (Neon)     │  │   (Cache)   │  │   (External)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Auth**: JWT tokens stored in client, validated on API/socket connections
2. **Deck Import**: Client parses Moxfield text → validates against Scryfall → saves to DB
3. **Room Creation**: Server generates unique room key, stores in-memory game state
4. **Real-time Play**: Socket.io broadcasts game events to all room participants
5. **Persistence**: Only users, decks, and game history stored in PostgreSQL

---

## Database Schema

```typescript
// src/lib/db/schema.ts

import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const decks = pgTable('decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  commander: varchar('commander', { length: 255 }).notNull(),
  cardList: jsonb('card_list').$type<{
    commander: string;
    cards: Array<{ name: string; quantity: number; scryfallId?: string }>;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cardCache = pgTable('card_cache', {
  name: varchar('name', { length: 255 }).primaryKey(),
  scryfallId: varchar('scryfall_id', { length: 50 }),
  imageUrl: varchar('image_url', { length: 500 }),
  manaCost: varchar('mana_cost', { length: 50 }),
  typeLine: varchar('type_line', { length: 255 }),
  oracleText: text('oracle_text'),
  cachedAt: timestamp('cached_at').defaultNow(),
});

export const gameHistory = pgTable('game_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomKey: varchar('room_key', { length: 10 }).notNull(),
  players: jsonb('players').$type<Array<{
    userId: string;
    deckId: string;
    displayName: string;
  }>>().notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
});
```

---

## Real-Time Game State

### Room Structure (In-Memory)

```typescript
interface Room {
  roomKey: string;              // 6-char alphanumeric (e.g., "ABC123")
  players: Map<string, PlayerState>;
  gameState: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  lastActivity: Date;
}

interface PlayerState {
  odId: string;
  odocketId: string;
  displayName: string;
  odeck: DeckData;
  zones: {
    commandZone: GameCard[];
    library: GameCard[];        // Face-down, shuffled
    hand: GameCard[];           // Hidden from opponents
    battlefield: BoardCard[];   // Visible to all
    graveyard: GameCard[];      // Visible to all
    exile: GameCard[];          // Visible to all (unless face-down)
  };
}

interface GameCard {
  instanceId: string;           // Unique per card instance in game
  cardName: string;
  scryfallId: string;
  imageUrl: string;
}

interface BoardCard extends GameCard {
  position: { x: number; y: number };
  tapped: boolean;
  faceDown: boolean;
  counters: number;
}
```

### Socket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `room:create` | Client → Server | `{ deckId }` | Create new room |
| `room:join` | Client → Server | `{ roomKey, deckId }` | Join existing room |
| `room:leave` | Client → Server | `{}` | Leave current room |
| `room:playerJoined` | Server → Room | `{ player }` | Notify of new player |
| `room:playerLeft` | Server → Room | `{ playerId }` | Notify of player leaving |
| `game:start` | Server → Room | `{ gameState }` | Game has started |
| `game:moveCard` | Client → Server | `{ cardId, fromZone, toZone, position? }` | Move card between zones |
| `game:cardMoved` | Server → Room | `{ playerId, cardId, cardData, fromZone, toZone, position? }` | Card was moved |
| `game:tapCard` | Client → Server | `{ cardId }` | Toggle tap state |
| `game:cardTapped` | Server → Room | `{ playerId, cardId, tapped }` | Card tap state changed |
| `game:shuffle` | Client → Server | `{}` | Shuffle library |
| `game:shuffled` | Server → Room | `{ playerId }` | Library was shuffled |
| `game:restart` | Client → Server | `{}` | Request game restart |
| `game:restarted` | Server → Room | `{ gameState }` | Game was restarted |
| `game:addToken` | Client → Server | `{ tokenData, position }` | Add token to battlefield |
| `game:tokenAdded` | Server → Room | `{ playerId, token }` | Token was added |

### Room Key Generation

```typescript
function generateRoomKey(): string {
  // Exclude confusing characters: 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 6; i++) {
    key += chars[crypto.randomInt(chars.length)];
  }
  return key;
}
```

---

## Drag & Drop Implementation

### Key Principle: Local Until Drop

Drag operations are **client-side only** until the card is dropped. Opponents never see cards mid-drag.

| Event | Local Update | Broadcast |
|-------|--------------|-----------|
| Drag start | Update local UI | None |
| Drag move | Update position | None |
| Drop | Optimistic update | Emit `game:moveCard` |
| Server confirms | Reconcile state | All players see result |

### Zone Visibility Rules

| Zone | Owner Sees | Opponent Sees |
|------|-----------|---------------|
| Hand | Card faces | Card backs (count only) |
| Library | Card backs (count) | Card backs (count) |
| Battlefield | Card faces | Card faces |
| Graveyard | Card faces | Card faces |
| Exile | Card faces | Card faces (unless face-down) |
| Command Zone | Card faces | Card faces |

### Implementation with @dnd-kit

```tsx
// src/components/game/GameBoard.tsx
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';

function GameBoard() {
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const socket = useGameStore(state => state.socket);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCard(event.active.data.current?.card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (over && active.data.current?.zone !== over.id) {
      socket.emit('game:moveCard', {
        cardId: active.id,
        fromZone: active.data.current?.zone,
        toZone: over.id,
        position: over.id === 'battlefield' ? getDropPosition(event) : null
      });
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="game-board">
        <OpponentArea />
        <DropZone id="battlefield"><Battlefield /></DropZone>
        <div className="my-zones">
          <DropZone id="hand"><Hand /></DropZone>
          <DropZone id="library"><Library /></DropZone>
          <DropZone id="graveyard"><Graveyard /></DropZone>
          <DropZone id="exile"><Exile /></DropZone>
          <DropZone id="commandZone"><CommandZone /></DropZone>
        </div>
      </div>

      {/* Drag preview - only visible to local player */}
      <DragOverlay>
        {activeCard && <CardPreview card={activeCard} />}
      </DragOverlay>
    </DndContext>
  );
}

function DropZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`zone zone-${id} ${isOver ? 'zone-highlight' : ''}`}
    >
      {children}
    </div>
  );
}
```

### Card Component with Tap

```tsx
// src/components/game/Card.tsx
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

interface CardProps {
  card: BoardCard;
  zone: string;
  isOwner: boolean;
}

function Card({ card, zone, isOwner }: CardProps) {
  const socket = useGameStore(state => state.socket);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.instanceId,
    data: { card, zone },
    disabled: !isOwner
  });

  const handleTap = () => {
    if (isOwner && zone === 'battlefield') {
      socket.emit('game:tapCard', { cardId: card.instanceId });
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`card ${isDragging ? 'dragging' : ''}`}
      animate={{ rotate: card.tapped ? 90 : 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleTap}
    >
      <img
        src={card.faceDown ? '/card-back.png' : card.imageUrl}
        alt={card.cardName}
        draggable={false}
      />
    </motion.div>
  );
}
```

---

## External API Integration

### Moxfield Text Parser

```typescript
// src/lib/moxfield-parser.ts

interface ParsedCard {
  quantity: number;
  name: string;
}

interface ParseResult {
  cards: ParsedCard[];
  errors: string[];
}

export function parseMoxfieldDeck(text: string): ParseResult {
  const lines = text.trim().split('\n');
  const cards: ParsedCard[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and section headers
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Format: "1 Card Name" or "1x Card Name"
    const match = trimmed.match(/^(\d+)x?\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();
      cards.push({ quantity, name });
    } else {
      errors.push(`Could not parse: ${line}`);
    }
  }

  return { cards, errors };
}
```

### Scryfall API Integration

```typescript
// src/lib/scryfall.ts

const SCRYFALL_API = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 100; // 10 requests/second max

interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
    };
  }>;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
}

export async function fetchCardData(cardName: string): Promise<ScryfallCard | null> {
  try {
    // Try exact match first
    const response = await fetch(
      `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(cardName)}`
    );

    if (response.ok) {
      return response.json();
    }

    // Fallback to fuzzy search
    const fuzzyResponse = await fetch(
      `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(cardName)}`
    );

    if (fuzzyResponse.ok) {
      return fuzzyResponse.json();
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch card: ${cardName}`, error);
    return null;
  }
}

export async function fetchDeckCards(
  cardNames: string[]
): Promise<Map<string, ScryfallCard>> {
  const results = new Map<string, ScryfallCard>();
  const uniqueNames = [...new Set(cardNames)];

  for (const name of uniqueNames) {
    const card = await fetchCardData(name);
    if (card) {
      results.set(name, card);
    }

    // Respect rate limit
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
  }

  return results;
}

export async function searchTokens(query: string): Promise<ScryfallCard[]> {
  const response = await fetch(
    `${SCRYFALL_API}/cards/search?q=t:token+${encodeURIComponent(query)}&unique=art`
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.data || [];
}

export function getCardImageUrl(card: ScryfallCard): string {
  // Handle double-faced cards
  if (card.card_faces?.[0]?.image_uris) {
    return card.card_faces[0].image_uris.normal;
  }
  return card.image_uris?.normal || '';
}
```

---

## State Management

```typescript
// src/store/gameStore.ts

import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface GameStore {
  // Connection
  socket: Socket | null;
  connected: boolean;

  // Room
  roomKey: string | null;
  gameState: 'waiting' | 'active' | 'ended' | null;

  // Players
  myId: string | null;
  players: Record<string, PlayerState>;

  // Actions
  setSocket: (socket: Socket) => void;
  setRoom: (roomKey: string) => void;
  setGameState: (state: 'waiting' | 'active' | 'ended') => void;

  // Game actions (emit to server)
  playCard: (cardId: string, fromZone: string, position?: Position) => void;
  tapCard: (cardId: string) => void;
  moveCard: (cardId: string, fromZone: string, toZone: string, position?: Position) => void;
  shuffle: () => void;
  restart: () => void;
  addToken: (tokenData: TokenData, position: Position) => void;

  // State updates (from server)
  onPlayerJoined: (player: PlayerState) => void;
  onPlayerLeft: (playerId: string) => void;
  onCardMoved: (data: CardMovedEvent) => void;
  onCardTapped: (data: CardTappedEvent) => void;
  onShuffled: (playerId: string) => void;
  onGameRestarted: (gameState: FullGameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  roomKey: null,
  gameState: null,
  myId: null,
  players: {},

  setSocket: (socket) => set({ socket, connected: true }),
  setRoom: (roomKey) => set({ roomKey }),
  setGameState: (gameState) => set({ gameState }),

  playCard: (cardId, fromZone, position) => {
    get().socket?.emit('game:moveCard', {
      cardId,
      fromZone,
      toZone: 'battlefield',
      position
    });
  },

  tapCard: (cardId) => {
    const socket = get().socket;
    // Optimistic update
    set(state => {
      const myId = state.myId;
      if (!myId) return state;

      const player = state.players[myId];
      const battlefield = player.zones.battlefield.map(card =>
        card.instanceId === cardId ? { ...card, tapped: !card.tapped } : card
      );

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            zones: { ...player.zones, battlefield }
          }
        }
      };
    });

    socket?.emit('game:tapCard', { cardId });
  },

  moveCard: (cardId, fromZone, toZone, position) => {
    get().socket?.emit('game:moveCard', { cardId, fromZone, toZone, position });
  },

  shuffle: () => {
    get().socket?.emit('game:shuffle');
  },

  restart: () => {
    get().socket?.emit('game:restart');
  },

  addToken: (tokenData, position) => {
    get().socket?.emit('game:addToken', { tokenData, position });
  },

  // Server event handlers
  onCardMoved: (data) => set(state => {
    const player = state.players[data.playerId];
    if (!player) return state;

    // Remove from source zone
    const fromZone = player.zones[data.fromZone].filter(
      c => c.instanceId !== data.cardId
    );

    // Add to destination zone
    const toZone = [...player.zones[data.toZone], data.cardData];

    return {
      players: {
        ...state.players,
        [data.playerId]: {
          ...player,
          zones: {
            ...player.zones,
            [data.fromZone]: fromZone,
            [data.toZone]: toZone
          }
        }
      }
    };
  }),

  onCardTapped: (data) => set(state => {
    const player = state.players[data.playerId];
    if (!player) return state;

    const battlefield = player.zones.battlefield.map(card =>
      card.instanceId === data.cardId ? { ...card, tapped: data.tapped } : card
    );

    return {
      players: {
        ...state.players,
        [data.playerId]: {
          ...player,
          zones: { ...player.zones, battlefield }
        }
      }
    };
  }),

  onPlayerJoined: (player) => set(state => ({
    players: { ...state.players, [player.odId]: player }
  })),

  onPlayerLeft: (playerId) => set(state => {
    const { [playerId]: removed, ...remaining } = state.players;
    return { players: remaining };
  }),

  onShuffled: (playerId) => {
    // Visual indication that opponent shuffled
    console.log(`Player ${playerId} shuffled their library`);
  },

  onGameRestarted: (gameState) => set({
    players: gameState.players,
    gameState: 'active'
  })
}));
```

---

## Component Architecture

```
src/
├── app/
│   ├── page.tsx                    # Landing page / Login
│   ├── lobby/
│   │   └── page.tsx                # Deck management, room creation
│   ├── room/
│   │   └── [key]/
│   │       └── page.tsx            # Game room
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   └── me/route.ts
│       ├── decks/
│       │   ├── route.ts            # GET (list), POST (create)
│       │   └── [id]/route.ts       # GET, PUT, DELETE
│       └── cards/
│           └── search/route.ts     # Scryfall proxy with caching
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── deck/
│   │   ├── DeckImporter.tsx        # Moxfield text import
│   │   ├── DeckPreview.tsx         # Card grid preview
│   │   ├── DeckList.tsx            # User's saved decks
│   │   └── DeckSelector.tsx        # Choose deck for game
│   ├── game/
│   │   ├── GameBoard.tsx           # Main game layout
│   │   ├── Card.tsx                # Draggable card component
│   │   ├── CardPreview.tsx         # Drag overlay / hover preview
│   │   ├── PlayerArea.tsx          # One player's zones
│   │   ├── OpponentArea.tsx        # Opponent's visible zones
│   │   ├── zones/
│   │   │   ├── Battlefield.tsx
│   │   │   ├── Hand.tsx
│   │   │   ├── Library.tsx
│   │   │   ├── Graveyard.tsx
│   │   │   ├── Exile.tsx
│   │   │   └── CommandZone.tsx
│   │   ├── GameControls.tsx        # Shuffle, restart, etc.
│   │   └── TokenSearch.tsx         # Modal for finding tokens
│   ├── lobby/
│   │   ├── CreateRoom.tsx
│   │   └── JoinRoom.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                # Drizzle client
│   │   └── schema.ts               # Database schema
│   ├── socket/
│   │   ├── server.ts               # Socket.io server setup
│   │   ├── events.ts               # Event handlers
│   │   └── rooms.ts                # Room management
│   ├── auth.ts                     # JWT utilities
│   ├── scryfall.ts                 # Scryfall API client
│   └── moxfield-parser.ts          # Deck list parser
├── store/
│   └── gameStore.ts                # Zustand store
├── hooks/
│   ├── useSocket.ts                # Socket.io connection hook
│   └── useAuth.ts                  # Authentication hook
└── types/
    └── index.ts                    # TypeScript interfaces
```

---

## Implementation Phases

### Phase 1: Project Foundation
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up Drizzle ORM with Neon PostgreSQL
- [ ] Create database schema and run migrations
- [ ] Implement JWT authentication (register, login, middleware)
- [ ] Create basic page layouts

### Phase 2: Deck Management
- [ ] Build Moxfield text parser
- [ ] Integrate Scryfall API with server-side caching
- [ ] Create deck import page with text input
- [ ] Build deck preview component with card images
- [ ] Implement saved decks CRUD (list, create, update, delete)
- [ ] Add deck selector for game rooms

### Phase 3: Real-Time Infrastructure
- [ ] Set up Socket.io server (custom server or serverless adapter)
- [ ] Implement room creation with unique key generation
- [ ] Build room joining flow with key validation
- [ ] Create in-memory game state management
- [ ] Define and implement all socket event handlers
- [ ] Add reconnection logic for dropped connections

### Phase 4: Game Board UI
- [ ] Build main game board layout
- [ ] Create player area component with zone layout
- [ ] Implement opponent area (visible zones only)
- [ ] Build individual zone components
- [ ] Style zones with proper MTG game layout

### Phase 5: Card Interactions
- [ ] Implement card component with @dnd-kit
- [ ] Add drag-and-drop between zones
- [ ] Implement tap/untap with rotation animation
- [ ] Build card preview on hover
- [ ] Add zone highlighting on drag over
- [ ] Ensure opponents only see drops, not drags

### Phase 6: Game Actions
- [ ] Implement shuffle functionality
- [ ] Add restart game capability
- [ ] Build token search modal
- [ ] Implement token spawning on battlefield
- [ ] Add game controls UI panel

### Phase 7: Polish & Deploy
- [ ] Add loading states and error handling
- [ ] Implement connection status indicator
- [ ] Add sound effects for card plays (optional)
- [ ] Test multiplayer scenarios
- [ ] Deploy to hosting platform
- [ ] Configure WebSocket support

---

## Deployment Considerations

### Option A: Vercel + External WebSocket Server
- Deploy Next.js app to Vercel
- Deploy Socket.io server to Railway or Render
- Configure CORS and connection URLs

### Option B: Full-Stack on Railway/Render
- Deploy entire application to Railway or Render
- Native WebSocket support
- Single deployment, simpler configuration

### Option C: Vercel + Managed WebSocket Service
- Deploy Next.js to Vercel
- Use Ably, Pusher, or similar for WebSockets
- Higher cost but fully managed

**Recommended:** Option B (Railway) for simplicity during development, migrate to Option A if scaling needed.

---

## Environment Variables

```env
# .env.local

# Database
DATABASE_URL=postgresql://user:pass@host:5432/manaroom

# Auth
JWT_SECRET=your-secret-key-here

# Redis (optional, for scaling)
REDIS_URL=redis://localhost:6379

# External URLs (if split deployment)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Real-time protocol | Socket.io | Auto-fallback, room support, proven reliability |
| State management | Zustand | Lightweight, simpler than Redux for real-time |
| Drag & drop | @dnd-kit | Multi-zone support, accessibility, customizable |
| Card data source | Scryfall API | Free, comprehensive, well-maintained |
| Game state storage | In-memory + Redis | Speed for real-time, no DB bottleneck |
| User data storage | PostgreSQL | Consistency with existing projects |
| Deployment | Railway | Native WebSocket support, simple setup |

---

## Security Considerations

1. **Server as Source of Truth**: All game actions validated server-side
2. **Rate Limiting**: Socket events rate-limited to prevent spam
3. **Room Key Expiry**: Rooms expire after 4 hours of inactivity
4. **JWT Validation**: All socket connections authenticated
5. **Input Sanitization**: Card names and user input sanitized before DB/API calls

---

## Future Enhancements (Out of Scope)

- [ ] Life counter integration
- [ ] Spectator mode
- [ ] Game replay/history
- [ ] Multiple opponents (4-player Commander)
- [ ] Card hover previews with Oracle text
- [ ] Deck statistics and mana curve
- [ ] Import from other sources (Archidekt, TappedOut)
- [ ] Mobile responsive layout

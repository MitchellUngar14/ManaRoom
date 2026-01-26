# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ManaRoom is a multiplayer Commander (Magic: The Gathering) web application for playing games online with friends. Players import decks from Moxfield, create/join game rooms with shareable codes, and play cards in real-time with drag-and-drop interactions.

## Tech Stack

- **Framework:** Next.js 16.1 (App Router) with React 19 and TypeScript
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Real-time:** Socket.io (separate server on port 3001)
- **State:** Zustand (manages both UI state and socket client)
- **Drag & Drop:** @dnd-kit/core with Framer Motion animations
- **Desktop:** Electron wrapper for standalone app
- **Card Data:** Scryfall API with database caching
- **Styling:** Tailwind CSS

## Commands

```bash
npm run dev              # Next.js dev server (port 3000)
npm run lint             # ESLint
npm run build            # Production build

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:push          # Push schema to Neon
npm run db:studio        # Open Drizzle Studio GUI

# Desktop App
npm run electron:dev     # Run Electron with hot-reload (starts Next.js + Electron)
npm run electron:build:win   # Build Windows executable
npm run electron:build:mac   # Build macOS dmg
npm run electron:build:linux # Build Linux AppImage
```

**Socket Server:** The game server runs separately and must be started manually:
```bash
node socket-server/server.js   # Starts on port 3001
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing

Optional:
- `NEXT_PUBLIC_SOCKET_URL` - Socket server URL (defaults to `http://localhost:3001`)

## Architecture

### Real-Time Game Flow

```
Client (Zustand Store)  ←→  Socket Server (In-Memory)  ←→  Other Clients
         ↓
   Next.js API Routes  ←→  Neon PostgreSQL
```

- **Game state is entirely in-memory** on the socket server - not persisted
- **Only users, decks, and card cache** are stored in PostgreSQL
- Optimistic updates: client updates store immediately, then emits socket event
- Server broadcasts to all room members; client reconciles on confirmation

### Key Files

| File | Purpose |
|------|---------|
| `socket-server/server.js` | In-memory game state, room management, all game event handlers |
| `src/store/gameStore.ts` | Zustand store with socket client, all game actions and state |
| `src/components/game/GameBoard.tsx` | DnD context, drop zone logic, board layout |
| `src/components/game/Card.tsx` | Draggable card with tap/counter support |
| `src/lib/db/schema.ts` | Drizzle schema (users, decks, cardCache, gameHistory) |
| `src/lib/clients/scryfall.ts` | Scryfall API client with fuzzy search |
| `src/lib/clients/moxfield.ts` | Deck text parser (handles "1x Card Name" format) |
| `electron/main.js` | Desktop wrapper configuration |

### Zone Components

All in `src/components/game/zones/`:
- `Hand.tsx` - Player's hand (hidden from opponents)
- `Battlefield.tsx` - Main play area with free positioning
- `Library.tsx` - Deck (face-down, shows count)
- `Graveyard.tsx` / `Exile.tsx` - Stacked card piles
- `CommandZone.tsx` - Commander display

### Socket Events

Client → Server:
- Room: `room:create`, `room:join`, `room:rejoin`, `room:leave`, `room:spectate`
- Card movement: `game:moveCard`, `game:repositionCard`
- Card state: `game:tapCard`, `game:untapAll`, `game:updateCardStats`
- Library: `game:shuffle`, `game:scry`
- Player: `game:setLife`
- Tokens/copies: `game:addToken`, `game:removeCard`, `game:createCopy`, `game:takeControl`
- Game flow: `game:restart`

Server → Client:
- Room: `room:joined`, `room:playerJoined`, `room:playerLeft`, `room:playerDisconnected`, `room:playerReconnected`
- Game: `game:started`, `game:restarted`
- Card: `game:cardMoved`, `game:cardRepositioned`, `game:cardTapped`, `game:allUntapped`, `game:cardRemoved`, `game:cardStatsUpdated`
- Library: `game:shuffled`, `game:scryed`
- Player: `game:lifeChanged`
- Tokens/copies: `game:tokenAdded`, `game:copyCreated`, `game:controlChanged`

### Database Schema

```
users        → id, email, passwordHash, displayName, createdAt
decks        → id, userId, name, commander, cardList (JSONB), timestamps
cardCache    → name (PK), scryfallId, imageUrl, manaCost, typeLine, colorIdentity, cachedAt
gameHistory  → id, roomKey, players (JSONB), startedAt, endedAt (optional, not actively used)
```

## Key Patterns

### Drag-and-Drop
- Drag is local-only until drop (opponents don't see mid-drag)
- Battlefield positions are stored as percentages (0-1) for responsive layout
- `useDroppable` on zones, `useDraggable` on cards with data payload `{ card, zone }`

### Card Instances
Each card in-game has a unique `instanceId` (UUID) separate from `scryfallId`. This enables tracking multiple copies, tokens, and per-card state (tapped, counters, power/toughness modifiers).

### Popout Windows / Spectator Mode
The `/room/[key]/opponent-view` route is a spectator-mode page designed for multi-monitor setups. It reads room context from `sessionStorage` and connects as a spectator via socket using `connectAsSpectator()`. The `actingAsPlayerId` state enables spectators to emit actions on behalf of a player.

### Reconnection Handling
- Players get 60 seconds to reconnect after disconnect (browser refresh, network issues)
- `sessionStorage` stores `playerId_${roomKey}` for automatic rejoin attempts
- Server tracks disconnected players in memory and broadcasts `room:playerDisconnected` / `room:playerReconnected`

### Authentication
JWT tokens stored in HTTP-only cookies with 7-day expiry. All API routes use `getSession()` from `src/lib/auth.ts`.

## Scryfall Integration

- Rate limit: 100ms delay between requests (10/second max)
- Fuzzy search fallback when exact match fails
- Cards cached in `cardCache` table to avoid repeated API calls
- Double-faced cards handled via `card_faces[0].image_uris`

## Development Setup

To run the full application locally:
1. Start the socket server: `node socket-server/server.js` (port 3001)
2. Start Next.js dev server: `npm run dev` (port 3000)
3. Open http://localhost:3000

For Electron desktop development: `npm run electron:dev` handles both servers.

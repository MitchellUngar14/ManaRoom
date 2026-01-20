# CLAUDE.md - ManaRoom

## Project Overview

ManaRoom is a multiplayer Commander (Magic: The Gathering) web application that allows players to import decks from Moxfield and play games online with friends.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Real-time:** Socket.io
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit/core
- **Card Data:** Scryfall API

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL (if separate deployment)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── game/         # Game board and card components
│   ├── deck/         # Deck import and management
│   └── ui/           # Shared UI components
├── lib/              # Utilities and configurations
│   ├── db/           # Drizzle schema and client
│   ├── socket/       # Socket.io server logic
│   ├── scryfall.ts   # Card data API
│   └── moxfield-parser.ts
├── store/            # Zustand stores
└── types/            # TypeScript interfaces
```

## Key Concepts

### Game State
- Active game state lives in-memory (not database)
- Only users, decks, and game history persisted to PostgreSQL
- Real-time sync via Socket.io

### Drag & Drop
- Drag operations are local-only until drop
- Opponents never see cards mid-drag
- Server broadcasts final card movements

### Card Data
- Fetched from Scryfall API
- Cached in PostgreSQL `card_cache` table
- Rate limit: 10 requests/second to Scryfall

## Related Documentation

See `PLAN.md` for the full implementation plan including:
- Database schema
- Socket event specifications
- Component architecture
- Implementation phases

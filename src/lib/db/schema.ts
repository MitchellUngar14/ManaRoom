import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved decks
export const decks = pgTable('decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  commander: varchar('commander', { length: 255 }).notNull(),
  cardList: jsonb('card_list')
    .$type<{
      commanders: Array<{ name: string; quantity: number; scryfallId?: string }>;
      cards: Array<{ name: string; quantity: number; scryfallId?: string }>;
    }>()
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Scryfall card cache (to reduce API calls)
export const cardCache = pgTable('card_cache', {
  name: varchar('name', { length: 255 }).primaryKey(),
  scryfallId: varchar('scryfall_id', { length: 50 }),
  imageUrl: varchar('image_url', { length: 500 }),
  imageUrlSmall: varchar('image_url_small', { length: 500 }),
  manaCost: varchar('mana_cost', { length: 50 }),
  cmc: integer('cmc'),
  typeLine: varchar('type_line', { length: 255 }),
  oracleText: text('oracle_text'),
  colorIdentity: jsonb('color_identity').$type<string[]>(),
  cachedAt: timestamp('cached_at').defaultNow(),
});

// Game history for stats/replay (optional)
export const gameHistory = pgTable('game_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomKey: varchar('room_key', { length: 10 }).notNull(),
  players: jsonb('players')
    .$type<
      Array<{
        odId: string;
        deckId: string;
        displayName: string;
        commander: string;
      }>
    >()
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
});

// Type exports for use in app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type CardCacheEntry = typeof cardCache.$inferSelect;
export type GameHistoryEntry = typeof gameHistory.$inferSelect;

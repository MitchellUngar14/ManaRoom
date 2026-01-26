import type { Card } from './card';

// Game-specific card instance (each physical card in game has unique ID)
export interface GameCard {
  instanceId: string;
  cardName: string;
  scryfallId: string;
  imageUrl: string;
  card: Card;
}

// Card on the battlefield with position and state
export interface BoardCard extends GameCard {
  position: { x: number; y: number };
  tapped: boolean;
  faceDown: boolean;
  counters: number;
  // Power/toughness modifications (for creatures)
  modifiedPower?: number;
  modifiedToughness?: number;
  // Whether this card is a copy (created via "Make a token copy")
  isCopy?: boolean;
}

// All zones a player can have cards in
export interface PlayerZones {
  commandZone: GameCard[];
  library: GameCard[];
  hand: GameCard[];
  battlefield: BoardCard[];
  graveyard: GameCard[];
  exile: GameCard[];
}

// A player's full state in the game
export interface PlayerState {
  odId: string;
  odocketId: string;
  displayName: string;
  odeck: {
    id: string;
    name: string;
    commander: string;
  };
  zones: PlayerZones;
  life: number;
}

// Room state
export interface Room {
  roomKey: string;
  hostId: string;
  players: Record<string, PlayerState>;
  gameState: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  lastActivity: Date;
}

// Zone types for drag and drop
export type ZoneType =
  | 'hand'
  | 'battlefield'
  | 'library'
  | 'graveyard'
  | 'exile'
  | 'commandZone';

// Socket event payloads
export interface MoveCardPayload {
  cardId: string;
  fromZone: ZoneType;
  toZone: ZoneType;
  position?: { x: number; y: number };
}

export interface CardMovedEvent {
  playerId: string;
  cardId: string;
  cardData: GameCard | BoardCard;
  fromZone: ZoneType;
  toZone: ZoneType;
  position?: { x: number; y: number };
  libraryPosition?: 'top' | 'bottom';
}

export interface CardTappedEvent {
  playerId: string;
  cardId: string;
  tapped: boolean;
}

export interface TokenData {
  name: string;
  scryfallId: string;
  imageUrl: string;
}

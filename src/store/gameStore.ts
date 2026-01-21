import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  PlayerState,
  ZoneType,
  GameCard,
  BoardCard,
  CardMovedEvent,
  CardTappedEvent,
  TokenData,
} from '@/types';

interface DeckData {
  commander: { name: string; scryfallId: string; imageUrl: string };
  cards: Array<{ name: string; quantity: number; scryfallId: string; imageUrl: string }>;
}

interface GameStore {
  // Connection state
  socket: Socket | null;
  connected: boolean;

  // Room state
  roomKey: string | null;
  gameState: 'waiting' | 'active' | 'ended' | null;

  // Players
  myId: string | null;
  players: Record<string, PlayerState>;

  // UI state
  previewCard: GameCard | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (deckId: string, deckData: DeckData, displayName: string) => Promise<string>;
  joinRoom: (roomKey: string, deckId: string, deckData: DeckData, displayName: string) => Promise<void>;
  leaveRoom: () => void;

  // Game actions
  moveCard: (
    cardId: string,
    fromZone: ZoneType,
    toZone: ZoneType,
    position?: { x: number; y: number }
  ) => void;
  repositionCard: (cardId: string, position: { x: number; y: number }) => void;
  tapCard: (cardId: string) => void;
  setLife: (amount: number) => void;
  shuffle: () => void;
  restart: () => void;
  addToken: (tokenData: TokenData, position: { x: number; y: number }) => void;
  drawCard: () => void;

  // UI actions
  setPreviewCard: (card: GameCard | null) => void;

  // Internal state updates
  _setConnected: (connected: boolean) => void;
  _setRoom: (roomKey: string, gameState: 'waiting' | 'active' | 'ended') => void;
  _setMyId: (id: string) => void;
  _setPlayers: (players: Record<string, PlayerState>) => void;
  _updatePlayer: (playerId: string, state: Partial<PlayerState>) => void;
  _onCardMoved: (event: CardMovedEvent) => void;
  _onCardTapped: (event: CardTappedEvent) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  roomKey: null,
  gameState: null,
  myId: null,
  players: {},
  previewCard: null,

  connect: async () => {
    return new Promise((resolve, reject) => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        set({ socket, connected: true });
        resolve();
      });

      socket.on('disconnect', () => {
        set({ connected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      // Set up event listeners
      socket.on('room:joined', (data) => {
        get()._setRoom(data.roomKey, data.gameState);
        get()._setMyId(data.playerId);
        get()._setPlayers(data.players);
      });

      socket.on('room:playerJoined', (data) => {
        get()._updatePlayer(data.player.odId, data.player);
      });

      socket.on('room:playerLeft', (data) => {
        set((state) => {
          const { [data.playerId]: _removed, ...remaining } = state.players;
          void _removed; // Intentionally unused
          return { players: remaining };
        });
      });

      socket.on('game:started', (data) => {
        set({ gameState: 'active', players: data.players });
      });

      socket.on('game:cardMoved', (data: CardMovedEvent) => {
        get()._onCardMoved(data);
      });

      socket.on('game:cardTapped', (data: CardTappedEvent) => {
        get()._onCardTapped(data);
      });

      socket.on('game:cardRepositioned', (data: { playerId: string; cardId: string; position: { x: number; y: number } }) => {
        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          const battlefield = player.zones.battlefield.map((card) => {
            if (card.instanceId === data.cardId) {
              return { ...card, position: data.position };
            }
            return card;
          });

          return {
            players: {
              ...state.players,
              [data.playerId]: {
                ...player,
                zones: {
                  ...player.zones,
                  battlefield,
                },
              },
            },
          };
        });
      });

      socket.on('game:shuffled', (data: { playerId: string; library?: GameCard[] }) => {
        // If we received the library (meaning we're the player who shuffled), update our state
        if (data.library && data.playerId === get().myId) {
          set((state) => {
            const player = state.players[data.playerId];
            if (!player) return state;

            return {
              players: {
                ...state.players,
                [data.playerId]: {
                  ...player,
                  zones: {
                    ...player.zones,
                    library: data.library!,
                  },
                },
              },
            };
          });
        }
        console.log(`Player ${data.playerId} shuffled their library`);
      });

      socket.on('game:lifeChanged', (data: { playerId: string; life: number }) => {
        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          return {
            players: {
              ...state.players,
              [data.playerId]: {
                ...player,
                life: data.life,
              },
            },
          };
        });
      });

      socket.on('game:restarted', (data) => {
        set({ gameState: 'active', players: data.players });
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false, roomKey: null, gameState: null });
    }
  },

  createRoom: async (deckId: string, deckData: DeckData, displayName: string) => {
    const { socket } = get();
    if (!socket) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      socket.emit(
        'room:create',
        { deckId, deckData, displayName },
        (response: { success: boolean; roomKey?: string; error?: string }) => {
          if (response.success && response.roomKey) {
            resolve(response.roomKey);
          } else {
            reject(new Error(response.error || 'Failed to create room'));
          }
        }
      );
    });
  },

  joinRoom: async (roomKey: string, deckId: string, deckData: DeckData, displayName: string) => {
    const { socket } = get();
    if (!socket) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      socket.emit(
        'room:join',
        { roomKey, deckId, deckData, displayName },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to join room'));
          }
        }
      );
    });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('room:leave');
    }
    set({ roomKey: null, gameState: null, players: {} });
  },

  moveCard: (cardId, fromZone, toZone, position) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const fromCards = [...player.zones[fromZone]];
      const cardIndex = fromCards.findIndex((c) => c.instanceId === cardId);
      if (cardIndex === -1) return state;

      const [card] = fromCards.splice(cardIndex, 1);
      const toCards = [...player.zones[toZone]];

      // If moving to battlefield, add position
      if (toZone === 'battlefield' && position) {
        const boardCard: BoardCard = {
          ...card,
          position,
          tapped: false,
          faceDown: false,
          counters: 0,
        };
        toCards.push(boardCard as GameCard);
      } else {
        toCards.push(card);
      }

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            zones: {
              ...player.zones,
              [fromZone]: fromCards,
              [toZone]: toCards,
            },
          },
        },
      };
    });

    socket.emit('game:moveCard', { cardId, fromZone, toZone, position });
  },

  repositionCard: (cardId, position) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const battlefield = player.zones.battlefield.map((card) => {
        if (card.instanceId === cardId) {
          return { ...card, position };
        }
        return card;
      });

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            zones: {
              ...player.zones,
              battlefield,
            },
          },
        },
      };
    });

    socket.emit('game:repositionCard', { cardId, position });
  },

  tapCard: (cardId) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const battlefield = player.zones.battlefield.map((card) => {
        const boardCard = card as BoardCard;
        if (boardCard.instanceId === cardId) {
          return { ...boardCard, tapped: !boardCard.tapped };
        }
        return card;
      });

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            zones: {
              ...player.zones,
              battlefield,
            },
          },
        },
      };
    });

    socket.emit('game:tapCard', { cardId });
  },

  setLife: (amount) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            life: amount,
          },
        },
      };
    });

    socket.emit('game:setLife', { life: amount });
  },

  shuffle: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('game:shuffle');
    }
  },

  restart: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('game:restart');
    }
  },

  addToken: (tokenData, position) => {
    const { socket } = get();
    if (socket) {
      socket.emit('game:addToken', { tokenData, position });
    }
  },

  drawCard: () => {
    const { myId, players, moveCard } = get();
    if (!myId) return;

    const player = players[myId];
    if (!player || player.zones.library.length === 0) return;

    const topCard = player.zones.library[player.zones.library.length - 1];
    moveCard(topCard.instanceId, 'library', 'hand');
  },

  setPreviewCard: (card) => set({ previewCard: card }),

  // Internal setters
  _setConnected: (connected) => set({ connected }),
  _setRoom: (roomKey, gameState) => set({ roomKey, gameState }),
  _setMyId: (myId) => set({ myId }),
  _setPlayers: (players) => set({ players }),
  _updatePlayer: (playerId, state) =>
    set((s) => ({
      players: {
        ...s.players,
        [playerId]: { ...s.players[playerId], ...state },
      },
    })),

  _onCardMoved: (event) =>
    set((state) => {
      const player = state.players[event.playerId];
      if (!player) return state;

      // Remove from source
      const fromCards = player.zones[event.fromZone].filter(
        (c) => c.instanceId !== event.cardId
      );

      // Remove from destination first (in case of optimistic update duplicate), then add
      const toCardsFiltered = player.zones[event.toZone].filter(
        (c) => c.instanceId !== event.cardId
      );
      const toCards = [...toCardsFiltered, event.cardData];

      return {
        players: {
          ...state.players,
          [event.playerId]: {
            ...player,
            zones: {
              ...player.zones,
              [event.fromZone]: fromCards,
              [event.toZone]: toCards,
            },
          },
        },
      };
    }),

  _onCardTapped: (event) =>
    set((state) => {
      const player = state.players[event.playerId];
      if (!player) return state;

      const battlefield = player.zones.battlefield.map((card) => {
        if (card.instanceId === event.cardId) {
          return { ...(card as BoardCard), tapped: event.tapped };
        }
        return card;
      });

      return {
        players: {
          ...state.players,
          [event.playerId]: {
            ...player,
            zones: {
              ...player.zones,
              battlefield,
            },
          },
        },
      };
    }),
}));

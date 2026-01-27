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

  // Spectator mode (for popout windows)
  spectatorMode: boolean;
  // When in spectator mode, this allows emitting actions on behalf of a player
  actingAsPlayerId: string | null;

  // UI state
  previewCard: GameCard | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (deckId: string, deckData: DeckData, displayName: string) => Promise<string>;
  joinRoom: (roomKey: string, deckId: string, deckData: DeckData, displayName: string) => Promise<void>;
  rejoinRoom: (roomKey: string, playerId: string) => Promise<boolean>;
  connectAsSpectator: (roomKey: string, actAsPlayerId?: string) => Promise<void>;
  leaveRoom: () => void;

  // Game actions
  moveCard: (
    cardId: string,
    fromZone: ZoneType,
    toZone: ZoneType,
    position?: { x: number; y: number },
    libraryPosition?: 'top' | 'bottom'
  ) => void;
  repositionCard: (cardId: string, position: { x: number; y: number }) => void;
  tapCard: (cardId: string) => void;
  untapAll: () => void;
  orderCards: () => void;
  setLife: (amount: number) => void;
  shuffle: () => void;
  restart: () => void;
  addToken: (tokenData: TokenData, position: { x: number; y: number }) => void;
  removeCard: (cardId: string, zone: ZoneType) => void;
  drawCard: () => void;
  takeControl: (cardId: string, fromPlayerId: string) => void;
  updateCardStats: (cardId: string, stats: { counters?: number; modifiedPower?: number; modifiedToughness?: number }) => void;
  createCardCopy: (card: BoardCard) => void;
  scryLibrary: (topCardIds: string[], bottomCardIds: string[]) => void;

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
  spectatorMode: false,
  actingAsPlayerId: null,
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
        // Store playerId in sessionStorage for reconnection after refresh
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`playerId_${data.roomKey}`, data.playerId);
        }
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

      socket.on('game:allUntapped', (data: { playerId: string; cardIds: string[] }) => {
        // Skip if this is our own action - we already did the optimistic update
        const { myId } = get();
        if (data.playerId === myId) return;

        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          const battlefield = player.zones.battlefield.map((card) => {
            if (data.cardIds.includes(card.instanceId)) {
              return { ...card, tapped: false };
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

      socket.on('game:cardsOrdered', (data: { playerId: string; cardUpdates: { cardId: string; position: { x: number; y: number } }[] }) => {
        // Skip if this is our own action - we already did the optimistic update
        const { myId } = get();
        if (data.playerId === myId) return;

        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          const battlefield = player.zones.battlefield.map((card) => {
            const update = data.cardUpdates.find((u) => u.cardId === card.instanceId);
            if (update) {
              return { ...card, position: update.position };
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

      socket.on('game:cardRemoved', (data: { playerId: string; cardId: string; zone: ZoneType }) => {
        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          const zoneCards = player.zones[data.zone].filter(
            (c) => c.instanceId !== data.cardId
          );

          return {
            players: {
              ...state.players,
              [data.playerId]: {
                ...player,
                zones: {
                  ...player.zones,
                  [data.zone]: zoneCards,
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

      socket.on('game:scryed', (data: { playerId: string; library?: GameCard[]; count?: number }) => {
        // If we received the library (meaning we're the player who scried), update our state
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
        console.log('game:restarted received:', data);
        set({ gameState: 'active', players: data.players });
      });

      socket.on('game:controlChanged', (data: { fromPlayerId: string; toPlayerId: string; cardId: string; cardData: BoardCard }) => {
        set((state) => {
          const fromPlayer = state.players[data.fromPlayerId];
          const toPlayer = state.players[data.toPlayerId];
          if (!fromPlayer || !toPlayer) return state;

          // Remove card from original owner's battlefield
          const fromBattlefield = fromPlayer.zones.battlefield.filter(
            (c) => c.instanceId !== data.cardId
          );

          // Add card to new owner's battlefield
          const toBattlefield = [...toPlayer.zones.battlefield, data.cardData];

          return {
            players: {
              ...state.players,
              [data.fromPlayerId]: {
                ...fromPlayer,
                zones: {
                  ...fromPlayer.zones,
                  battlefield: fromBattlefield,
                },
              },
              [data.toPlayerId]: {
                ...toPlayer,
                zones: {
                  ...toPlayer.zones,
                  battlefield: toBattlefield,
                },
              },
            },
          } as { players: Record<string, PlayerState> };
        });
      });

      socket.on('game:cardStatsUpdated', (data: { playerId: string; cardId: string; stats: { counters?: number; modifiedPower?: number; modifiedToughness?: number } }) => {
        set((state) => {
          const player = state.players[data.playerId];
          if (!player) return state;

          const battlefield = player.zones.battlefield.map((card) => {
            if (card.instanceId === data.cardId) {
              return {
                ...card,
                counters: data.stats.counters ?? card.counters,
                modifiedPower: data.stats.modifiedPower ?? card.modifiedPower,
                modifiedToughness: data.stats.modifiedToughness ?? card.modifiedToughness,
              };
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

      socket.on('game:copyCreated', (data: { playerId: string; copyCard: BoardCard }) => {
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
                  battlefield: [...player.zones.battlefield, data.copyCard],
                },
              },
            },
          };
        });
      });

      socket.on('game:tokenAdded', (data: { playerId: string; token: BoardCard }) => {
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
                  battlefield: [...player.zones.battlefield, data.token],
                },
              },
            },
          };
        });
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

  rejoinRoom: async (roomKey: string, odPlayerId: string) => {
    const { socket } = get();
    if (!socket) throw new Error('Not connected');

    return new Promise((resolve) => {
      socket.emit(
        'room:rejoin',
        { roomKey, odPlayerId },
        (response: { success: boolean; playerId?: string; error?: string }) => {
          if (response.success) {
            resolve(true);
          } else {
            // Rejoin failed - player will need to join fresh
            resolve(false);
          }
        }
      );
    });
  },

  connectAsSpectator: async (roomKey: string, actAsPlayerId?: string) => {
    const { socket } = get();
    if (!socket) throw new Error('Not connected');

    return new Promise((resolve, reject) => {
      socket.emit(
        'room:spectate',
        { roomKey },
        (response: { success: boolean; roomKey?: string; gameState?: 'waiting' | 'active' | 'ended'; players?: Record<string, PlayerState>; error?: string }) => {
          if (response.success && response.roomKey) {
            set({
              spectatorMode: true,
              roomKey: response.roomKey,
              gameState: response.gameState || null,
              players: response.players || {},
              actingAsPlayerId: actAsPlayerId || null,
            });
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to spectate room'));
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

  moveCard: (cardId, fromZone, toZone, position, libraryPosition) => {
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

      // Prepare the card to add
      let cardToAdd: GameCard;
      if (toZone === 'battlefield' && position) {
        // If moving to battlefield, add position
        const boardCard: BoardCard = {
          ...card,
          position,
          tapped: false,
          faceDown: false,
          counters: 0,
        };
        cardToAdd = boardCard as GameCard;
      } else if (fromZone === 'battlefield') {
        // Leaving battlefield - remove battlefield-specific properties (untap, clear position, etc.)
        const boardCard = card as BoardCard;
        cardToAdd = {
          instanceId: card.instanceId,
          cardName: card.cardName,
          scryfallId: card.scryfallId,
          imageUrl: card.imageUrl,
          card: boardCard.card,
        };
      } else {
        cardToAdd = card;
      }

      // Add to destination zone (handle library positioning)
      if (toZone === 'library' && libraryPosition === 'bottom') {
        toCards.unshift(cardToAdd); // Add to beginning (bottom of library)
      } else {
        toCards.push(cardToAdd); // Add to end (top of library, or normal for other zones)
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

    socket.emit('game:moveCard', { cardId, fromZone, toZone, position, libraryPosition });
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

  untapAll: () => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update - untap all tapped cards
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const battlefield = player.zones.battlefield.map((card) => {
        const boardCard = card as BoardCard;
        if (boardCard.tapped) {
          return { ...boardCard, tapped: false };
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

    socket.emit('game:untapAll');
  },

  orderCards: () => {
    const { socket, myId, players } = get();
    if (!socket || !myId) return;

    const player = players[myId];
    if (!player) return;

    const battlefield = player.zones.battlefield;
    if (battlefield.length === 0) return;

    // Categorize cards by type
    const creatures: BoardCard[] = [];
    const permanents: BoardCard[] = []; // Non-creature, non-land permanents
    const lands: BoardCard[] = [];

    battlefield.forEach((card) => {
      const boardCard = card as BoardCard;
      const typeLine = (boardCard.card?.typeLine || '').toLowerCase();

      // Skip instants and sorceries (shouldn't be on battlefield anyway)
      if (typeLine.includes('instant') || typeLine.includes('sorcery')) {
        return;
      }

      if (typeLine.includes('creature')) {
        creatures.push(boardCard);
      } else if (typeLine.includes('land')) {
        lands.push(boardCard);
      } else {
        // Artifacts, enchantments, planeswalkers, etc.
        permanents.push(boardCard);
      }
    });

    // Sort each category by card name to group same cards together
    const sortByName = (a: BoardCard, b: BoardCard) =>
      (a.cardName || '').localeCompare(b.cardName || '');

    creatures.sort(sortByName);
    permanents.sort(sortByName);
    lands.sort(sortByName);

    // Calculate positions for each category
    // Left third: creatures (x: 0.05 - 0.30)
    // Middle third: permanents (x: 0.35 - 0.65)
    // Right third: lands (x: 0.70 - 0.95)
    const cardUpdates: { cardId: string; position: { x: number; y: number } }[] = [];

    const positionCards = (cards: BoardCard[], xStart: number, xEnd: number) => {
      if (cards.length === 0) return;

      const xRange = xEnd - xStart;
      const cols = Math.ceil(Math.sqrt(cards.length * 1.5)); // Slightly more columns than rows
      const rows = Math.ceil(cards.length / cols);

      const xSpacing = xRange / (cols + 1);
      const ySpacing = 0.8 / (rows + 1); // Use 80% of vertical space

      cards.forEach((card, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = xStart + xSpacing * (col + 1);
        const y = 0.1 + ySpacing * (row + 1); // Start 10% from top

        cardUpdates.push({
          cardId: card.instanceId,
          position: { x, y },
        });
      });
    };

    positionCards(creatures, 0.02, 0.30);
    positionCards(permanents, 0.35, 0.65);
    positionCards(lands, 0.70, 0.98);

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const updatedBattlefield = player.zones.battlefield.map((card) => {
        const update = cardUpdates.find((u) => u.cardId === card.instanceId);
        if (update) {
          return { ...card, position: update.position };
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
              battlefield: updatedBattlefield,
            },
          },
        },
      };
    });

    socket.emit('game:orderCards', { cardUpdates });
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
    console.log('restart called, socket:', !!socket, 'connected:', socket?.connected);
    if (socket) {
      console.log('Emitting game:restart');
      socket.emit('game:restart');
    } else {
      console.error('Cannot restart: no socket connection');
    }
  },

  addToken: (tokenData, position) => {
    const { socket } = get();
    if (socket) {
      socket.emit('game:addToken', { tokenData, position });
    }
  },

  removeCard: (cardId, zone) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update - remove card from zone
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const zoneCards = player.zones[zone].filter((c) => c.instanceId !== cardId);

      return {
        players: {
          ...state.players,
          [myId]: {
            ...player,
            zones: {
              ...player.zones,
              [zone]: zoneCards,
            },
          },
        },
      };
    });

    socket.emit('game:removeCard', { cardId, zone });
  },

  drawCard: () => {
    const { myId, players, moveCard } = get();
    if (!myId) return;

    const player = players[myId];
    if (!player || player.zones.library.length === 0) return;

    const topCard = player.zones.library[player.zones.library.length - 1];
    moveCard(topCard.instanceId, 'library', 'hand');
  },

  takeControl: (cardId, fromPlayerId) => {
    const { socket, myId, actingAsPlayerId } = get();
    const effectivePlayerId = myId || actingAsPlayerId;
    if (!socket || !effectivePlayerId) return;

    socket.emit('game:takeControl', { cardId, fromPlayerId, toPlayerId: effectivePlayerId });
  },

  updateCardStats: (cardId, stats) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Optimistic update
    set((state) => {
      const player = state.players[myId];
      if (!player) return state;

      const battlefield = player.zones.battlefield.map((card) => {
        if (card.instanceId === cardId) {
          return {
            ...card,
            counters: stats.counters ?? card.counters,
            modifiedPower: stats.modifiedPower ?? card.modifiedPower,
            modifiedToughness: stats.modifiedToughness ?? card.modifiedToughness,
          };
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

    socket.emit('game:updateCardStats', { cardId, stats });
  },

  createCardCopy: (card) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    // Generate a slightly offset position for the copy
    const copyPosition = {
      x: Math.min(0.95, (card.position?.x ?? 0.5) + 0.05),
      y: card.position?.y ?? 0.5,
    };

    socket.emit('game:createCopy', {
      cardId: card.instanceId,
      position: copyPosition,
    });
  },

  scryLibrary: (topCardIds, bottomCardIds) => {
    const { socket, myId } = get();
    if (!socket || !myId) return;

    socket.emit('game:scry', { topCardIds, bottomCardIds });
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

      // Handle library positioning (bottom means unshift, top/default means push)
      let toCards;
      if (event.toZone === 'library' && event.libraryPosition === 'bottom') {
        toCards = [event.cardData, ...toCardsFiltered];
      } else {
        toCards = [...toCardsFiltered, event.cardData];
      }

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

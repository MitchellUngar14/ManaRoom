import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://manaroom.vercel.app',
];

// In-memory room storage
const rooms = new Map();

// Track disconnected players for reconnection (playerId -> { roomKey, disconnectTime })
const disconnectedPlayers = new Map();
const RECONNECT_WINDOW_MS = 60 * 1000; // 60 seconds to reconnect

// Room key generation (excludes confusing characters)
function generateRoomKey() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 6; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// Shuffle array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize player zones from deck data
function initializePlayerZones(deckData) {
  const zones = {
    commandZone: [],
    library: [],
    hand: [],
    battlefield: [],
    graveyard: [],
    exile: [],
  };

  // Add commander to command zone
  if (deckData.commander) {
    zones.commandZone.push({
      instanceId: uuidv4(),
      cardName: deckData.commander.name,
      scryfallId: deckData.commander.scryfallId,
      imageUrl: deckData.commander.imageUrl,
      card: deckData.commander.card || null, // Full Scryfall card data
    });
  }

  // Add cards to library
  if (deckData.cards) {
    for (const card of deckData.cards) {
      for (let i = 0; i < (card.quantity || 1); i++) {
        zones.library.push({
          instanceId: uuidv4(),
          cardName: card.name,
          scryfallId: card.scryfallId,
          imageUrl: card.imageUrl,
          card: card.card || null, // Full Scryfall card data
        });
      }
    }
  }

  // Shuffle library
  shuffleArray(zones.library);

  return zones;
}

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentRoom = null;
  let playerId = null;

  // Create a new room
  socket.on('room:create', async ({ deckId, deckData, displayName }, callback) => {
    try {
      const roomKey = generateRoomKey();
      playerId = uuidv4();

      const playerState = {
        odId: playerId,
        socketId: socket.id,
        displayName: displayName || 'Player',
        odeck: {
          id: deckId,
          commander: deckData?.commander?.name || 'Unknown Commander',
        },
        zones: initializePlayerZones(deckData || {}),
        life: 40,
      };

      const room = {
        roomKey,
        players: new Map([[playerId, playerState]]),
        gameState: 'waiting',
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      rooms.set(roomKey, room);
      currentRoom = roomKey;

      socket.join(roomKey);

      // Draw initial hand (7 cards) immediately so player can experiment while waiting
      for (let i = 0; i < 7 && playerState.zones.library.length > 0; i++) {
        const card = playerState.zones.library.pop();
        playerState.zones.hand.push(card);
      }

      console.log(`Room created: ${roomKey} by player ${playerId}`);

      callback({
        success: true,
        roomKey,
        playerId,
      });

      // Emit to self that room was joined
      socket.emit('room:joined', {
        roomKey,
        gameState: 'waiting',
        playerId,
        players: Object.fromEntries(room.players),
      });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join an existing room
  socket.on('room:join', async ({ roomKey, deckId, deckData, displayName }, callback) => {
    try {
      const room = rooms.get(roomKey.toUpperCase());

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.size >= 4) {
        callback({ success: false, error: 'Room is full (max 4 players)' });
        return;
      }

      playerId = uuidv4();

      const playerState = {
        odId: playerId,
        socketId: socket.id,
        displayName: displayName || `Player ${room.players.size + 1}`,
        odeck: {
          id: deckId,
          commander: deckData?.commander?.name || 'Unknown Commander',
        },
        zones: initializePlayerZones(deckData || {}),
        life: 40,
      };

      room.players.set(playerId, playerState);
      room.lastActivity = new Date();
      currentRoom = roomKey.toUpperCase();

      socket.join(currentRoom);

      // Draw initial hand (7 cards) immediately so player can experiment
      for (let i = 0; i < 7 && playerState.zones.library.length > 0; i++) {
        const card = playerState.zones.library.pop();
        playerState.zones.hand.push(card);
      }

      console.log(`Player ${playerId} joined room ${currentRoom}`);

      callback({ success: true, playerId });

      // Emit to self
      socket.emit('room:joined', {
        roomKey: currentRoom,
        gameState: room.gameState,
        playerId,
        players: Object.fromEntries(room.players),
      });

      // Notify others in the room
      socket.to(currentRoom).emit('room:playerJoined', {
        player: playerState,
      });

      // Auto-start game when 2+ players join
      if (room.players.size >= 2 && room.gameState === 'waiting') {
        room.gameState = 'active';

        io.to(currentRoom).emit('game:started', {
          gameState: 'active',
          players: Object.fromEntries(room.players),
        });

        console.log(`Game started in room ${currentRoom}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Spectate a room (read-only viewer for popout window)
  socket.on('room:spectate', ({ roomKey }, callback) => {
    try {
      const normalizedKey = roomKey.toUpperCase();
      const room = rooms.get(normalizedKey);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Join socket room to receive broadcasts, but don't add as player
      socket.join(normalizedKey);
      currentRoom = normalizedKey;
      // Don't set playerId - this is spectator only

      console.log(`Spectator joined room ${normalizedKey}`);

      callback({
        success: true,
        roomKey: normalizedKey,
        gameState: room.gameState,
        players: Object.fromEntries(room.players),
      });
    } catch (error) {
      console.error('Error spectating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Rejoin room after disconnect (e.g., page refresh)
  socket.on('room:rejoin', async ({ roomKey, odPlayerId }, callback) => {
    try {
      const normalizedKey = roomKey.toUpperCase();
      const room = rooms.get(normalizedKey);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Check if this player exists in the room
      const existingPlayer = room.players.get(odPlayerId);
      if (!existingPlayer) {
        // Check if player was recently disconnected
        const disconnectInfo = disconnectedPlayers.get(odPlayerId);
        if (!disconnectInfo || disconnectInfo.roomKey !== normalizedKey) {
          callback({ success: false, error: 'Player not found in room' });
          return;
        }
      }

      // Restore the player's socket connection
      playerId = odPlayerId;
      currentRoom = normalizedKey;

      // Update the player's socket ID
      const player = room.players.get(playerId);
      if (player) {
        player.socketId = socket.id;
      }

      // Remove from disconnected players if present
      disconnectedPlayers.delete(playerId);

      socket.join(currentRoom);
      room.lastActivity = new Date();

      console.log(`Player ${playerId} rejoined room ${currentRoom}`);

      callback({ success: true, playerId });

      // Send full game state to the rejoining player
      socket.emit('room:joined', {
        roomKey: currentRoom,
        gameState: room.gameState,
        playerId,
        players: Object.fromEntries(room.players),
      });

      // Notify others that player reconnected
      socket.to(currentRoom).emit('room:playerReconnected', { playerId });
    } catch (error) {
      console.error('Error rejoining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Leave room
  socket.on('room:leave', () => {
    if (currentRoom && playerId) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.players.delete(playerId);
        socket.to(currentRoom).emit('room:playerLeft', { playerId });

        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} deleted (empty)`);
        }
      }
      socket.leave(currentRoom);
      console.log(`Player ${playerId} left room ${currentRoom}`);
      currentRoom = null;
      playerId = null;
    }
  });

  // Move card between zones
  socket.on('game:moveCard', ({ cardId, fromZone, toZone, position }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Find and remove card from source zone
    const fromCards = player.zones[fromZone];
    const cardIndex = fromCards.findIndex((c) => c.instanceId === cardId);
    if (cardIndex === -1) return;

    const [card] = fromCards.splice(cardIndex, 1);

    // Add to destination zone
    if (toZone === 'battlefield' && position) {
      player.zones[toZone].push({
        ...card,
        position,
        tapped: false,
        faceDown: false,
        counters: 0,
      });
    } else {
      player.zones[toZone].push(card);
    }

    room.lastActivity = new Date();

    // Broadcast to all players in room (including sender for confirmation)
    io.to(currentRoom).emit('game:cardMoved', {
      playerId,
      cardId,
      cardData: player.zones[toZone][player.zones[toZone].length - 1],
      fromZone,
      toZone,
      position,
    });
  });

  // Reposition card on battlefield
  socket.on('game:repositionCard', ({ cardId, position }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    const card = player.zones.battlefield.find((c) => c.instanceId === cardId);
    if (!card) return;

    card.position = position;
    room.lastActivity = new Date();

    // Broadcast to other players (not sender, they already updated optimistically)
    socket.to(currentRoom).emit('game:cardRepositioned', {
      playerId,
      cardId,
      position,
    });
  });

  // Tap/untap card
  socket.on('game:tapCard', ({ cardId }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    const card = player.zones.battlefield.find((c) => c.instanceId === cardId);
    if (!card) return;

    card.tapped = !card.tapped;
    room.lastActivity = new Date();

    io.to(currentRoom).emit('game:cardTapped', {
      playerId,
      cardId,
      tapped: card.tapped,
    });
  });

  // Set life total
  socket.on('game:setLife', ({ life }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.life = life;
    room.lastActivity = new Date();

    // Broadcast to other players (not sender, they already updated optimistically)
    socket.to(currentRoom).emit('game:lifeChanged', {
      playerId,
      life,
    });
  });

  // Shuffle library
  socket.on('game:shuffle', () => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    shuffleArray(player.zones.library);
    room.lastActivity = new Date();

    // Send shuffled library to the player who shuffled
    socket.emit('game:shuffled', { playerId, library: player.zones.library });

    // Notify other players (they don't need to see the library contents)
    socket.to(currentRoom).emit('game:shuffled', { playerId });
  });

  // Restart game
  socket.on('game:restart', () => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    // Re-initialize all players
    for (const [, player] of room.players) {
      // Collect all cards
      const allCards = [
        ...player.zones.commandZone,
        ...player.zones.library,
        ...player.zones.hand,
        ...player.zones.battlefield.map((c) => ({
          instanceId: c.instanceId,
          cardName: c.cardName,
          scryfallId: c.scryfallId,
          imageUrl: c.imageUrl,
        })),
        ...player.zones.graveyard,
        ...player.zones.exile,
      ];

      // Separate commander
      const commander = allCards.find((c) =>
        player.odeck.commander.toLowerCase() === c.cardName.toLowerCase()
      );
      const otherCards = allCards.filter((c) =>
        player.odeck.commander.toLowerCase() !== c.cardName.toLowerCase()
      );

      // Reset zones
      player.zones = {
        commandZone: commander ? [commander] : [],
        library: shuffleArray(otherCards),
        hand: [],
        battlefield: [],
        graveyard: [],
        exile: [],
      };

      // Draw 7 cards
      for (let i = 0; i < 7 && player.zones.library.length > 0; i++) {
        player.zones.hand.push(player.zones.library.pop());
      }
    }

    room.gameState = 'active';
    room.lastActivity = new Date();

    io.to(currentRoom).emit('game:restarted', {
      gameState: 'active',
      players: Object.fromEntries(room.players),
    });

    console.log(`Game restarted in room ${currentRoom}`);
  });

  // Remove card (used for deleting tokens)
  socket.on('game:removeCard', ({ cardId, zone }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Find and remove card from zone
    const zoneCards = player.zones[zone];
    const cardIndex = zoneCards.findIndex((c) => c.instanceId === cardId);
    if (cardIndex === -1) return;

    zoneCards.splice(cardIndex, 1);
    room.lastActivity = new Date();

    // Broadcast to all players
    io.to(currentRoom).emit('game:cardRemoved', {
      playerId,
      cardId,
      zone,
    });
  });

  // Take control of opponent's card
  // toPlayerId can be passed explicitly (for spectator/popout windows acting on behalf of a player)
  socket.on('game:takeControl', ({ cardId, fromPlayerId, toPlayerId }) => {
    if (!currentRoom) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    // Use toPlayerId if provided (from popout), otherwise use socket's playerId
    const effectiveToPlayerId = toPlayerId || playerId;
    if (!effectiveToPlayerId) return;

    const fromPlayer = room.players.get(fromPlayerId);
    const toPlayer = room.players.get(effectiveToPlayerId);
    if (!fromPlayer || !toPlayer) return;

    // Find the card on the opponent's battlefield
    const cardIndex = fromPlayer.zones.battlefield.findIndex((c) => c.instanceId === cardId);
    if (cardIndex === -1) return;

    // Remove from opponent's battlefield
    const [card] = fromPlayer.zones.battlefield.splice(cardIndex, 1);

    // Add to our battlefield (keeping position and other properties)
    toPlayer.zones.battlefield.push(card);
    room.lastActivity = new Date();

    // Broadcast to all players
    io.to(currentRoom).emit('game:controlChanged', {
      fromPlayerId,
      toPlayerId: effectiveToPlayerId,
      cardId,
      cardData: card,
    });
  });

  // Add token
  socket.on('game:addToken', ({ tokenData, position }) => {
    if (!currentRoom || !playerId) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    const token = {
      instanceId: uuidv4(),
      cardName: tokenData.name || 'Token',
      scryfallId: tokenData.scryfallId || '',
      imageUrl: tokenData.imageUrl || '',
      isToken: true,
      position,
      tapped: false,
      faceDown: false,
      counters: 0,
      power: tokenData.power,
      toughness: tokenData.toughness,
    };

    player.zones.battlefield.push(token);
    room.lastActivity = new Date();

    io.to(currentRoom).emit('game:tokenAdded', {
      playerId,
      token,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (currentRoom && playerId) {
      const room = rooms.get(currentRoom);
      if (room && room.players.has(playerId)) {
        // Don't delete immediately - give them a chance to reconnect
        disconnectedPlayers.set(playerId, {
          roomKey: currentRoom,
          disconnectTime: Date.now(),
        });

        // Notify others that player disconnected (but may reconnect)
        socket.to(currentRoom).emit('room:playerDisconnected', { playerId });

        console.log(`Player ${playerId} disconnected from ${currentRoom}, waiting for reconnect...`);

        // Schedule cleanup after reconnect window
        setTimeout(() => {
          const disconnectInfo = disconnectedPlayers.get(playerId);
          if (disconnectInfo && disconnectInfo.roomKey === currentRoom) {
            // Player didn't reconnect in time, remove them
            disconnectedPlayers.delete(playerId);
            const roomToClean = rooms.get(currentRoom);
            if (roomToClean) {
              roomToClean.players.delete(playerId);
              io.to(currentRoom).emit('room:playerLeft', { playerId });
              console.log(`Player ${playerId} removed from ${currentRoom} (reconnect timeout)`);

              if (roomToClean.players.size === 0) {
                rooms.delete(currentRoom);
                console.log(`Room ${currentRoom} deleted (empty)`);
              }
            }
          }
        }, RECONNECT_WINDOW_MS);
      }
    }
  });
});

// Cleanup stale rooms every 30 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, room] of rooms) {
    const inactiveTime = now - room.lastActivity;
    if (inactiveTime > 2 * 60 * 60 * 1000) {
      // 2 hours
      rooms.delete(key);
      console.log(`Room ${key} deleted (stale)`);
    }
  }
}, 30 * 60 * 1000);

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

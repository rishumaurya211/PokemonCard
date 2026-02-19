import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/matches.js';
import pokemonRoutes from './routes/pokemon.js';
import referralRoutes from './routes/referrals.js';
import milestoneRoutes from './routes/milestones.js';
import adminRoutes from './routes/admin.js';
import battleRoomRoutes from './routes/battleRooms.js';
import { initializeAdmin } from './utils/adminSetup.js';
import { battleRooms } from './utils/gameState.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/battle-rooms', battleRoomRoutes);
app.set('io', io);

// Socket.io for real-time battles
// Using shared battleRooms from gameState.js

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a battle room
  socket.on('join-battle-room', ({ roomId, userId, username }) => {
    socket.join(roomId);

    if (!battleRooms.has(roomId)) {
      battleRooms.set(roomId, {
        roomId,
        players: [],
        gameState: 'waiting',
        battleHistory: [],
        currentRound: 0,
        roundSelections: {}
      });
    }

    const room = battleRooms.get(roomId);

    // Ensure room properties exist even if created via API
    if (!room.players) room.players = [];
    if (!room.battleHistory) room.battleHistory = [];
    if (room.currentRound === undefined) room.currentRound = 0;
    if (!room.roundSelections) room.roundSelections = {};

    if (!room.players.find(p => p.userId === userId)) {
      room.players.push({ userId, username, socketId: socket.id });
    } else {
      // Update socket ID if user reconnects
      const player = room.players.find(p => p.userId === userId);
      player.socketId = socket.id;
    }

    io.to(roomId).emit('room-update', {
      players: room.players.length,
      playerList: room.players.map(p => ({
        userId: p.userId,
        username: p.username || 'Anonymous'
      })),
      gameState: room.gameState
    });

    // Start battle when 2 players join
    if (room.players.length === 2) {
      if (room.gameState === 'waiting') {
        room.gameState = 'ready';
      }
      io.to(roomId).emit('battle-ready');
    }
  });

  // Handle manual leave
  socket.on('leave-battle-room', ({ roomId }) => {
    socket.leave(roomId);
    const room = battleRooms.get(roomId);
    if (room) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const userId = room.players[playerIndex].userId;
        room.players[playerIndex].socketId = null;
        io.to(roomId).emit('player-left', { userId });
      }
    }
  });

  // Handle player action in battle
  socket.on('battle-action', ({ roomId, action, data }) => {
    const room = battleRooms.get(roomId);
    if (!room) return;

    if (action === 'card-selected') {
      const userId = data.userId;
      if (!userId) return;

      room.roundSelections[userId] = data.pokemon;

      // Notify other player that opponent has made a move (but not which card)
      socket.to(roomId).emit('opponent-selected', { userId });

      // If both players in the room have selected
      if (Object.keys(room.roundSelections).length === 2) {
        const revealData = {
          selections: room.roundSelections,
          round: room.currentRound + 1
        };

        // Broadcast reveal to everyone in room
        io.to(roomId).emit('round-revealed', revealData);

        // Increment round and clear selections
        room.currentRound += 1;
        room.roundSelections = {};

        // Check for game over
        if (room.currentRound >= 6) {
          setTimeout(() => {
            room.gameState = 'gameOver';
            io.to(roomId).emit('game-over-triggered', {
              finalRound: room.currentRound
            });
          }, 4000); // Give time for the last round reveal to finish
        }
      }
    } else if (action === 'match-init') {
      // Store and sync the database match ID between players
      room.matchId = data.matchId;
      socket.to(roomId).emit('match-initialized', { matchId: data.matchId });
    } else {
      // Broadcast other actions like chat, etc.
      socket.to(roomId).emit('battle-action', { action, data });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up rooms
    battleRooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        console.log(`User ${room.players[playerIndex].userId} socket disconnected from room ${roomId}`);
        // Simply null the socket ID so they can reconnect later
        room.players[playerIndex].socketId = null;
        io.to(roomId).emit('player-status-update', { userId: room.players[playerIndex].userId, status: 'offline' });
      }
    });
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pokemon-battle';

// Modern mongoose connection (no options needed for latest versions)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${MONGODB_URI.split('/').pop().split('?')[0]}`);
    // Initialize admin user
    initializeAdmin();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n💡 Troubleshooting steps:');
    console.error('   1. Make sure MongoDB is running:');
    console.error('      - Windows: Check if MongoDB service is running');
    console.error('      - Or start manually: mongod');
    console.error('   2. Check your MONGODB_URI in .env file');
    console.error('   3. If using MongoDB Atlas, verify your connection string');
    console.error('   4. Default connection: mongodb://localhost:27017/pokemon-battle\n');
    process.exit(1); // Exit if DB connection fails
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

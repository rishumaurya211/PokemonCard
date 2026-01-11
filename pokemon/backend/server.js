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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/battle-rooms', battleRoomRoutes);

// Socket.io for real-time battles
const battleRooms = new Map(); // roomId -> { player1, player2, gameState }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a battle room
  socket.on('join-battle-room', ({ roomId, userId }) => {
    socket.join(roomId);
    
    if (!battleRooms.has(roomId)) {
      battleRooms.set(roomId, {
        players: [],
        gameState: 'waiting',
        battleHistory: []
      });
    }

    const room = battleRooms.get(roomId);
    if (!room.players.find(p => p.userId === userId)) {
      room.players.push({ userId, socketId: socket.id });
    }

    io.to(roomId).emit('room-update', {
      players: room.players.length,
      gameState: room.gameState
    });

    // Start battle when 2 players join
    if (room.players.length === 2 && room.gameState === 'waiting') {
      room.gameState = 'ready';
      io.to(roomId).emit('battle-ready');
    }
  });

  // Handle player action in battle
  socket.on('battle-action', ({ roomId, action, data }) => {
    const room = battleRooms.get(roomId);
    if (room) {
      // Broadcast action to other player
      socket.to(roomId).emit('battle-action', { action, data });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up rooms
    battleRooms.forEach((room, roomId) => {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      if (room.players.length === 0) {
        battleRooms.delete(roomId);
      } else {
        io.to(roomId).emit('player-left');
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

import express from 'express';
import { protect } from '../middleware/auth.js';
import { battleRooms, roomCodeMap } from '../utils/gameState.js';

const router = express.Router();

// @route   POST /api/battle-rooms/create
// @desc    Create a new battle room
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const roomCode = roomId.split('_')[2].toUpperCase().substring(0, 6);

    battleRooms.set(roomId, {
      roomCode,
      roomId,
      createdBy: req.user._id.toString(),
      players: [{
        userId: req.user._id.toString(),
        username: req.user.username,
        socketId: null
      }],
      gameState: 'waiting',
      player1Team: null,
      player2Team: null,
      battleHistory: [],
      currentRound: 0,
      roundSelections: {},
      createdAt: new Date()
    });

    // Map room code to roomId for quick lookup
    roomCodeMap.set(roomCode, roomId);

    res.json({
      success: true,
      room: {
        roomId,
        roomCode
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/battle-rooms/join
// @desc    Join a battle room by code
// @access  Private
router.post('/join', protect, async (req, res) => {
  console.log(`User ${req.user.username} attempting to join room with code: ${req.body.roomCode}`);
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: 'Room code is required'
      });
    }

    // Find room by code using the code map
    const normalizedCode = roomCode.toUpperCase();
    const foundRoomId = roomCodeMap.get(normalizedCode);

    if (!foundRoomId) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Please check the code.'
      });
    }

    const room = battleRooms.get(foundRoomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.'
      });
    }

    // Check if user is already in the room
    const existingPlayer = room.players.find(
      p => p.userId === req.user._id.toString()
    );

    if (existingPlayer) {
      return res.json({
        success: true,
        room: {
          roomId: foundRoomId,
          roomCode: room.roomCode,
          players: room.players.length,
          gameState: room.gameState
        }
      });
    }

    // Check if room is full
    if (room.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Add player to room
    room.players.push({
      userId: req.user._id.toString(),
      username: req.user.username,
      socketId: null
    });

    if (room.players.length === 2) {
      room.gameState = 'ready';
    }

    console.log(`Room ${room.roomId} is now ${room.gameState} with ${room.players.length} players`);

    res.json({
      success: true,
      room: {
        roomId: foundRoomId,
        roomCode: room.roomCode,
        players: room.players.length,
        gameState: room.gameState
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/battle-rooms/submit-team
// @desc    Submit player's Pokemon team
// @access  Private
// IMPORTANT: This route MUST come before /:roomId to avoid route conflicts
router.post('/submit-team', protect, async (req, res) => {
  try {
    const { roomId, pokemonTeam } = req.body;

    if (!roomId || !pokemonTeam || pokemonTeam.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and 6 Pokemon are required'
      });
    }

    const room = battleRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const playerIndex = room.players.findIndex(
      p => p.userId === req.user._id.toString()
    );

    if (playerIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not in this room'
      });
    }

    // Store team for the player
    if (playerIndex === 0) {
      room.player1Team = pokemonTeam;
    } else {
      room.player2Team = pokemonTeam;
    }

    // Check if both teams are ready
    const bothReady = room.player1Team && room.player2Team;

    if (bothReady) {
      const io = req.app.get('io');
      if (io) {
        io.to(roomId).emit('teams-ready');
      }
    }

    res.json({
      success: true,
      teamSubmitted: true,
      bothTeamsReady: bothReady,
      room: {
        roomId,
        players: room.players.length,
        player1Ready: !!room.player1Team,
        player2Ready: !!room.player2Team
      }
    });
  } catch (error) {
    console.error('Submit team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/battle-rooms/get-by-code/:roomCode
// @desc    Get room by code
// @access  Private
// IMPORTANT: This route MUST come before /:roomId to avoid route conflicts
router.get('/get-by-code/:roomCode', protect, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const normalizedCode = roomCode.toUpperCase();
    const roomId = roomCodeMap.get(normalizedCode);

    if (!roomId) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const room = battleRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: {
        roomId,
        roomCode: room.roomCode,
        players: room.players.length,
        gameState: room.gameState,
        playerList: room.players,
        player1Ready: !!room.player1Team,
        player2Ready: !!room.player2Team
      }
    });
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/battle-rooms/:roomId/opponent-team
// @desc    Get opponent's team (once both teams are submitted)
// @access  Private
// IMPORTANT: This route MUST come before /:roomId to avoid route conflicts
router.get('/:roomId/opponent-team', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = battleRooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const playerIndex = room.players.findIndex(
      p => p.userId === req.user._id.toString()
    );

    if (playerIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not in this room'
      });
    }

    // Get opponent's info and team
    const opponentInfo = room.players.find(p => p.userId !== req.user._id.toString());
    const opponentTeam = playerIndex === 0 ? room.player2Team : room.player1Team;

    if (!opponentTeam) {
      return res.json({
        success: true,
        opponentTeam: null,
        message: 'Opponent team not ready yet'
      });
    }

    res.json({
      success: true,
      opponentTeam,
      opponent: opponentInfo ? {
        userId: opponentInfo.userId,
        username: opponentInfo.username
      } : null
    });
  } catch (error) {
    console.error('Get opponent team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/battle-rooms/:roomId
// @desc    Get room status
// @access  Private
// IMPORTANT: This must be LAST as it's a catch-all parameter route
router.get('/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = battleRooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: {
        roomId,
        roomCode: room.roomCode,
        players: room.players.length,
        gameState: room.gameState,
        playerList: room.players,
        player1Ready: !!room.player1Team,
        player2Ready: !!room.player2Team
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

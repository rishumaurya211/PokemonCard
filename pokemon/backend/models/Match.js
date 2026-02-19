import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  player1: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    pokemonTeam: [{
      pokemonId: { type: Number, required: true },
      pokemonName: { type: String, required: true },
      attack: { type: Number, required: true }
    }]
  },
  player2: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username: { type: String, required: true }, // Can be 'Bot' or actual username
    pokemonTeam: [{
      pokemonId: { type: Number, required: true },
      pokemonName: { type: String, required: true },
      attack: { type: Number, required: true }
    }]
  },
  matchType: {
    type: String,
    enum: ['vs-bot', 'vs-friend', 'custom'],
    required: true
  },
  rounds: [{
    roundNumber: { type: Number, required: true },
    player1Pokemon: {
      pokemonId: { type: Number, required: true },
      pokemonName: { type: String, required: true },
      attack: { type: Number, required: true }
    },
    player2Pokemon: {
      pokemonId: { type: Number, required: true },
      pokemonName: { type: String, required: true },
      attack: { type: Number, required: true }
    },
    winner: { type: String, enum: ['player1', 'player2', 'draw'], required: true }
  }],
  finalScore: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', 'draw'],
    required: true
  },
  roomId: {
    type: String,
    default: null
  },
  milestonePointsAwarded: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
matchSchema.index({ 'player1.userId': 1, createdAt: -1 });
matchSchema.index({ 'player2.userId': 1, createdAt: -1 });
matchSchema.index({ createdAt: -1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;

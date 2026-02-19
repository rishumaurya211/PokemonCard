import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['matches', 'points', 'wins', 'referrals'],
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  rewards: {
    milestonePoints: { type: Number, default: 0 },
    pokemonUnlocks: [{ type: Number }], // Array of pokemon IDs
    bonusPoints: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;

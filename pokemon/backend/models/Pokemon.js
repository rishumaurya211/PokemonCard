import mongoose from 'mongoose';

const pokemonSchema = new mongoose.Schema({
  pokemonId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    lowercase: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  unlockRequirement: {
    type: {
      type: String,
      enum: ['milestone', 'referral', 'default'],
      default: 'default'
    },
    milestoneMatches: { type: Number, default: null },
    milestonePoints: { type: Number, default: null },
    referralCount: { type: Number, default: null }
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
// (pokemonId unique: true already creates an index)
pokemonSchema.index({ isLocked: 1, 'unlockRequirement.milestoneMatches': 1 });

const Pokemon = mongoose.model('Pokemon', pokemonSchema);

export default Pokemon;

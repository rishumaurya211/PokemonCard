import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    required: true
  },
  rewardsClaimed: {
    referrer: { type: Boolean, default: false },
    referredUser: { type: Boolean, default: false }
  },
  milestonePointsAwarded: {
    referrer: { type: Number, default: 0 },
    referredUser: { type: Number, default: 0 }
  },
  pokemonUnlocked: {
    referrer: [{ type: Number }],
    referredUser: [{ type: Number }]
  }
}, {
  timestamps: true
});

// Index for faster queries
referralSchema.index({ referrer: 1, createdAt: -1 });
referralSchema.index({ referralCode: 1 });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;

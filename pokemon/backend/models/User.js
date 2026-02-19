import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 }
  },
  milestonePoints: {
    type: Number,
    default: 0
  },
  unlockedPokemon: [{
    pokemonId: { type: Number, required: true },
    unlockedAt: { type: Date, default: Date.now },
    unlockedVia: { type: String, enum: ['milestone', 'referral', 'default'], default: 'default' }
  }],
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: {
    type: Date,
    default: null
  },
  bannedReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', async function (next) {
  // Only generate if it's a new user and doesn't have a referral code
  if (this.isNew && !this.referralCode && this.username) {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.referralCode = `${this.username.substring(0, 3).toUpperCase()}${randomString}${timestamp}`;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate win percentage
userSchema.methods.calculateWinPercentage = function () {
  if (this.stats.matchesPlayed === 0) return 0;
  return Math.round((this.stats.wins / this.stats.matchesPlayed) * 100);
};

// Update win percentage
userSchema.methods.updateStats = function (result) {
  this.stats.matchesPlayed += 1;
  if (result === 'win') {
    this.stats.wins += 1;
  } else if (result === 'loss') {
    this.stats.losses += 1;
  } else {
    this.stats.draws += 1;
  }
  this.stats.winPercentage = this.calculateWinPercentage();
};

const User = mongoose.model('User', userSchema);

export default User;

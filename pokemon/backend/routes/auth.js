import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('referralCode')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Check referral code if provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create user
    console.log('Creating new user:', { username, email });
    let user;
    try {
      user = await User.create({
        username,
        email,
        password,
        referredBy
      });
      console.log('✅ User created successfully:', {
        id: user._id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        role: user.role
      });
    } catch (createError) {
      console.error('❌ User creation error:', createError);
      if (createError.code === 11000) {
        // Duplicate key error
        const field = Object.keys(createError.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`
        });
      }
      throw createError;
    }

    // Handle referral if exists
    if (referredBy) {
      await Referral.create({
        referrer: referredBy,
        referredUser: user._id,
        referralCode: referralCode.toUpperCase()
      });

      // Update referrer's referred users list
      await User.findByIdAndUpdate(referredBy, {
        $push: { referredUsers: user._id }
      });

      // Award milestone points (can be configured)
      user.milestonePoints += 50; // Bonus for signing up with referral
      await user.save();

      const referrerUser = await User.findById(referredBy);
      referrerUser.milestonePoints += 100; // Bonus for referring
      await referrerUser.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        milestonePoints: user.milestonePoints,
        referralCode: user.referralCode,
        unlockedPokemon: user.unlockedPokemon
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned',
        reason: user.bannedReason
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        milestonePoints: user.milestonePoints,
        referralCode: user.referralCode,
        unlockedPokemon: user.unlockedPokemon
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'username')
      .populate('referredUsers', 'username');

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        milestonePoints: user.milestonePoints,
        referralCode: user.referralCode,
        unlockedPokemon: user.unlockedPokemon,
        referredBy: user.referredBy,
        referredUsers: user.referredUsers,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;

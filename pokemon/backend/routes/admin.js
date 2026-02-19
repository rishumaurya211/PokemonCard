import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Referral from '../models/Referral.js';
import Milestone from '../models/Milestone.js';
import Pokemon from '../models/Pokemon.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 'stats.matchesPlayed': { $gt: 0 } });
    const totalMatches = await Match.countDocuments();
    const totalReferrals = await Referral.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Recent activity
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt');
    const recentMatches = await Match.find().sort({ createdAt: -1 }).limit(5)
      .populate('player1.userId', 'username')
      .populate('player2.userId', 'username');

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalMatches,
        totalReferrals,
        bannedUsers
      },
      recentActivity: {
        users: recentUsers,
        matches: recentMatches
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get specific user details
// @access  Private/Admin
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('referredBy', 'username email')
      .populate('referredUsers', 'username email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userMatches = await Match.find({
      $or: [
        { 'player1.userId': user._id },
        { 'player2.userId': user._id }
      ]
    }).countDocuments();

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        totalMatches: userMatches
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

// @route   PUT /api/admin/users/:userId/ban
// @desc    Ban or unban a user
// @access  Private/Admin
router.put('/users/:userId/ban', [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = isBanned !== undefined ? isBanned : !user.isBanned;
    if (user.isBanned) {
      user.bannedAt = new Date();
      user.bannedReason = reason || 'No reason provided';
    } else {
      user.bannedAt = null;
      user.bannedReason = null;
    }

    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        bannedReason: user.bannedReason
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/matches
// @desc    Get all matches with pagination
// @access  Private/Admin
router.get('/matches', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find()
      .populate('player1.userId', 'username')
      .populate('player2.userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Match.countDocuments();

    res.json({
      success: true,
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/referrals
// @desc    Get all referrals
// @access  Private/Admin
router.get('/referrals', async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('referrer', 'username email')
      .populate('referredUser', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
      total: referrals.length
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/milestones
// @desc    Get all milestones
// @access  Private/Admin
router.get('/milestones', async (req, res) => {
  try {
    const milestones = await Milestone.find().sort({ threshold: 1 });

    res.json({
      success: true,
      milestones
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/milestones
// @desc    Create a new milestone
// @access  Private/Admin
router.post('/milestones', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['matches', 'points', 'wins', 'referrals']).withMessage('Invalid milestone type'),
  body('threshold').isNumeric().withMessage('Threshold must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const milestone = await Milestone.create(req.body);

    res.status(201).json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/milestones/:milestoneId
// @desc    Update a milestone
// @access  Private/Admin
router.put('/milestones/:milestoneId', async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(
      req.params.milestoneId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/milestones/:milestoneId
// @desc    Delete a milestone
// @access  Private/Admin
router.delete('/milestones/:milestoneId', async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndDelete(req.params.milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/pokemon
// @desc    Add or update a Pokemon
// @access  Private/Admin
router.post('/pokemon', [
  body('pokemonId').isNumeric().withMessage('Pokemon ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const pokemon = await Pokemon.findOneAndUpdate(
      { pokemonId: req.body.pokemonId },
      { ...req.body, addedBy: req.user._id },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      pokemon
    });
  } catch (error) {
    console.error('Add Pokemon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

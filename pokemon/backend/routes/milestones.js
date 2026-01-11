import express from 'express';
import Milestone from '../models/Milestone.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/milestones
// @desc    Get all milestones with user progress
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const milestones = await Milestone.find({ isActive: true }).sort({ threshold: 1 });

    const milestonesWithProgress = milestones.map(milestone => {
      let current = 0;
      let achieved = false;

      switch (milestone.type) {
        case 'matches':
          current = user.stats.matchesPlayed;
          achieved = current >= milestone.threshold;
          break;
        case 'points':
          current = user.milestonePoints;
          achieved = current >= milestone.threshold;
          break;
        case 'wins':
          current = user.stats.wins;
          achieved = current >= milestone.threshold;
          break;
        case 'referrals':
          current = user.referredUsers.length;
          achieved = current >= milestone.threshold;
          break;
      }

      return {
        ...milestone.toObject(),
        current,
        achieved,
        progress: Math.min((current / milestone.threshold) * 100, 100)
      };
    });

    res.json({
      success: true,
      milestones: milestonesWithProgress,
      userStats: {
        matchesPlayed: user.stats.matchesPlayed,
        milestonePoints: user.milestonePoints,
        wins: user.stats.wins,
        referrals: user.referredUsers.length
      }
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

// @route   GET /api/milestones/my-progress
// @desc    Get user's milestone progress
// @access  Private
router.get('/my-progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referredUsers');
    const milestones = await Milestone.find({ isActive: true }).sort({ threshold: 1 });

    const progress = milestones.map(milestone => {
      let current = 0;

      switch (milestone.type) {
        case 'matches':
          current = user.stats.matchesPlayed;
          break;
        case 'points':
          current = user.milestonePoints;
          break;
        case 'wins':
          current = user.stats.wins;
          break;
        case 'referrals':
          current = user.referredUsers.length;
          break;
      }

      return {
        milestoneId: milestone._id,
        name: milestone.name,
        type: milestone.type,
        threshold: milestone.threshold,
        current,
        achieved: current >= milestone.threshold,
        progress: Math.min((current / milestone.threshold) * 100, 100),
        rewards: milestone.rewards
      };
    });

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Get milestone progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

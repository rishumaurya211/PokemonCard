import express from 'express';
import Referral from '../models/Referral.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/referrals/my-referral-code
// @desc    Get user's referral code
// @access  Private
router.get('/my-referral-code', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/signup?ref=${user.referralCode}`
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/referrals/my-referrals
// @desc    Get users referred by current user
// @access  Private
router.get('/my-referrals', protect, async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referredUser', 'username email createdAt stats')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
      totalReferrals: referrals.length
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

// @route   GET /api/referrals/stats
// @desc    Get referral statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referredUsers', 'username email stats');

    const referralCount = user.referredUsers.length;
    const activeReferrals = user.referredUsers.filter(
      ref => ref.stats.matchesPlayed > 0
    ).length;

    res.json({
      success: true,
      stats: {
        totalReferrals: referralCount,
        activeReferrals,
        referralCode: user.referralCode,
        referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/signup?ref=${user.referralCode}`,
        referredUsers: user.referredUsers
      }
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/referrals/validate
// @desc    Validate a referral code
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      valid: true,
      referrer: {
        username: referrer.username
      }
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

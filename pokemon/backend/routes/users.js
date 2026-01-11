import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'username email')
      .populate('referredUsers', 'username email');

    // Get recent matches
    const recentMatches = await Match.find({
      $or: [
        { 'player1.userId': req.user._id },
        { 'player2.userId': req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('matchType winner finalScore createdAt');

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        milestonePoints: user.milestonePoints,
        referralCode: user.referralCode,
        unlockedPokemon: user.unlockedPokemon,
        referredBy: user.referredBy,
        referredUsers: user.referredUsers,
        createdAt: user.createdAt
      },
      recentMatches
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/battle-history
// @desc    Get user battle history
// @access  Private
router.get('/battle-history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      $or: [
        { 'player1.userId': req.user._id },
        { 'player2.userId': req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('player1 player2 matchType winner finalScore rounds createdAt');

    const total = await Match.countDocuments({
      $or: [
        { 'player1.userId': req.user._id },
        { 'player2.userId': req.user._id }
      ]
    });

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
    console.error('Get battle history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/unlocked-pokemon
// @desc    Get user's unlocked Pokemon
// @access  Private
router.get('/unlocked-pokemon', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('unlockedPokemon');
    
    res.json({
      success: true,
      unlockedPokemon: user.unlockedPokemon
    });
  } catch (error) {
    console.error('Get unlocked Pokemon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get detailed user statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all matches for this user
    const allMatches = await Match.find({
      $or: [
        { 'player1.userId': userId },
        { 'player2.userId': userId }
      ]
    });

    // Calculate detailed stats
    const stats = {
      totalMatches: allMatches.length,
      vsBot: allMatches.filter(m => m.matchType === 'vs-bot').length,
      vsFriend: allMatches.filter(m => m.matchType === 'vs-friend').length,
      custom: allMatches.filter(m => m.matchType === 'custom').length,
      wins: 0,
      losses: 0,
      draws: 0,
      favoritePokemon: {},
      averageScore: { wins: 0, losses: 0 }
    };

    allMatches.forEach(match => {
      const isPlayer1 = match.player1.userId.toString() === userId.toString();
      const won = (isPlayer1 && match.winner === 'player1') || (!isPlayer1 && match.winner === 'player2');
      const lost = (isPlayer1 && match.winner === 'player2') || (!isPlayer1 && match.winner === 'player1');
      
      if (won) stats.wins++;
      else if (lost) stats.losses++;
      else stats.draws++;

      // Track favorite Pokemon
      const team = isPlayer1 ? match.player1.pokemonTeam : match.player2.pokemonTeam;
      team.forEach(p => {
        stats.favoritePokemon[p.pokemonId] = (stats.favoritePokemon[p.pokemonId] || 0) + 1;
      });
    });

    // Get most used Pokemon
    const favoritePokemon = Object.entries(stats.favoritePokemon)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pokemonId, count]) => ({ pokemonId: parseInt(pokemonId), count }));

    res.json({
      success: true,
      stats: {
        ...stats,
        favoritePokemon,
        winPercentage: stats.totalMatches > 0 
          ? Math.round((stats.wins / stats.totalMatches) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

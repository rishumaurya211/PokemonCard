import express from 'express';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Milestone from '../models/Milestone.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/matches/create
// @desc    Create a new match
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const { player2UserId, matchType, pokemonTeam, roomId } = req.body;

    if (!matchType || !pokemonTeam || pokemonTeam.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid match data. Need 6 Pokemon and match type.'
      });
    }

    const player1 = {
      userId: req.user._id,
      username: req.user.username,
      pokemonTeam: pokemonTeam.map(p => ({
        pokemonId: p.id,
        pokemonName: p.name,
        attack: p.stats[1].base_stat
      }))
    };

    // For bot matches, player2 will be set when battle completes
    const matchData = {
      player1,
      player2: {
        userId: player2UserId || null,
        username: player2UserId ? 'Friend' : 'Bot',
        pokemonTeam: [] // Will be set when battle starts
      },
      matchType,
      roomId: roomId || null,
      winner: 'draw'
    };

    const match = await Match.create(matchData);

    res.status(201).json({
      success: true,
      match
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/matches/:matchId/complete
// @desc    Complete a match and update stats
// @access  Private
router.post('/:matchId/complete', protect, async (req, res) => {
  try {
    const { rounds, finalScore, winner, player2Team } = req.body;

    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Verify user is part of this match
    const isPlayer1 = match.player1.userId.toString() === req.user._id.toString();
    const isPlayer2 = match.player2.userId && match.player2.userId.toString() === req.user._id.toString();

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this match'
      });
    }

    // Update match data
    if (player2Team && player2Team.length === 6) {
      match.player2.pokemonTeam = player2Team.map(p => ({
        pokemonId: p.id,
        pokemonName: p.name,
        attack: p.stats[1].base_stat
      }));
    }

    match.rounds = rounds;
    match.finalScore = finalScore;
    match.winner = winner;
    await match.save();

    // Update user stats
    const player1User = await User.findById(match.player1.userId);
    const player2User = match.player2.userId ? await User.findById(match.player2.userId) : null;

    if (player1User) {
      if (winner === 'player1') {
        player1User.updateStats('win');
        player1User.milestonePoints += 10; // Points for winning
      } else if (winner === 'player2') {
        player1User.updateStats('loss');
        player1User.milestonePoints += 5; // Points for playing
      } else {
        player1User.updateStats('draw');
        player1User.milestonePoints += 5;
      }
      await player1User.save();

      // Check milestones
      await checkAndAwardMilestones(player1User);
    }

    if (player2User) {
      if (winner === 'player2') {
        player2User.updateStats('win');
        player2User.milestonePoints += 10;
      } else if (winner === 'player1') {
        player2User.updateStats('loss');
        player2User.milestonePoints += 5;
      } else {
        player2User.updateStats('draw');
        player2User.milestonePoints += 5;
      }
      await player2User.save();

      await checkAndAwardMilestones(player2User);
    }

    res.json({
      success: true,
      match
    });
  } catch (error) {
    console.error('Complete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function to check and award milestones
async function checkAndAwardMilestones(user) {
  const milestones = await Milestone.find({ isActive: true });

  for (const milestone of milestones) {
    let achieved = false;

    switch (milestone.type) {
      case 'matches':
        achieved = user.stats.matchesPlayed >= milestone.threshold;
        break;
      case 'points':
        achieved = user.milestonePoints >= milestone.threshold;
        break;
      case 'wins':
        achieved = user.stats.wins >= milestone.threshold;
        break;
      case 'referrals':
        achieved = user.referredUsers.length >= milestone.threshold;
        break;
    }

    if (achieved) {
      // Check if already unlocked
      const pokemonToUnlock = milestone.rewards.pokemonUnlocks || [];
      
      for (const pokemonId of pokemonToUnlock) {
        const alreadyUnlocked = user.unlockedPokemon.some(
          up => up.pokemonId === pokemonId
        );

        if (!alreadyUnlocked) {
          user.unlockedPokemon.push({
            pokemonId,
            unlockedVia: 'milestone'
          });
        }
      }

      // Award bonus points
      if (milestone.rewards.bonusPoints) {
        user.milestonePoints += milestone.rewards.bonusPoints;
      }

      await user.save();
    }
  }
}

// @route   GET /api/matches/:matchId
// @desc    Get match details
// @access  Private
router.get('/:matchId', protect, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('player1.userId', 'username')
      .populate('player2.userId', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.json({
      success: true,
      match
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

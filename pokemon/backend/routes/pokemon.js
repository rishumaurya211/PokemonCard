import express from 'express';
import Pokemon from '../models/Pokemon.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/pokemon
// @desc    Get all Pokemon with unlock status for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const unlockedPokemonIds = user.unlockedPokemon.map(up => up.pokemonId);

    // Get all Pokemon from database (or fetch from PokeAPI)
    // For now, we'll return the unlock status for requested Pokemon IDs
    const { pokemonIds } = req.query;

    if (pokemonIds) {
      const ids = pokemonIds.split(',').map(id => parseInt(id));
      const pokemonData = ids.map(id => ({
        pokemonId: id,
        isUnlocked: unlockedPokemonIds.includes(id) || user.role === 'admin'
      }));

      return res.json({
        success: true,
        pokemon: pokemonData
      });
    }

    // If no specific IDs, return all unlocked Pokemon for user
    res.json({
      success: true,
      unlockedPokemon: unlockedPokemonIds
    });
  } catch (error) {
    console.error('Get Pokemon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/pokemon/check-unlock/:pokemonId
// @desc    Check if a Pokemon is unlocked for user
// @access  Private
router.get('/check-unlock/:pokemonId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const pokemonId = parseInt(req.params.pokemonId);

    const isUnlocked = user.unlockedPokemon.some(
      up => up.pokemonId === pokemonId
    ) || user.role === 'admin';

    res.json({
      success: true,
      isUnlocked,
      pokemonId
    });
  } catch (error) {
    console.error('Check unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/pokemon/unlock
// @desc    Manually unlock a Pokemon (for testing or rewards)
// @access  Private
router.post('/unlock', protect, async (req, res) => {
  try {
    const { pokemonId } = req.body;

    if (!pokemonId) {
      return res.status(400).json({
        success: false,
        message: 'Pokemon ID is required'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already unlocked
    const alreadyUnlocked = user.unlockedPokemon.some(
      up => up.pokemonId === pokemonId
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Pokemon already unlocked'
      });
    }

    // Add to unlocked Pokemon
    user.unlockedPokemon.push({
      pokemonId,
      unlockedVia: 'manual'
    });

    await user.save();

    res.json({
      success: true,
      message: 'Pokemon unlocked successfully',
      unlockedPokemon: user.unlockedPokemon
    });
  } catch (error) {
    console.error('Unlock Pokemon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

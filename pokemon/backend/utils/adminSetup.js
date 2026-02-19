import User from '../models/User.js';
import Milestone from '../models/Milestone.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Default milestone definitions seeded on server start.
 * Admins can update/delete these from the admin panel.
 */
const DEFAULT_MILESTONES = [
  {
    name: 'First Battle',
    type: 'matches',
    threshold: 1,
    description: 'Play your very first Pokémon battle!',
    rewards: { milestonePoints: 20, bonusPoints: 0, pokemonUnlocks: [] }
  },
  {
    name: 'Battle Veteran',
    type: 'matches',
    threshold: 5,
    description: 'Complete 5 battles to earn this milestone.',
    rewards: { milestonePoints: 50, bonusPoints: 10, pokemonUnlocks: [25] } // Pikachu
  },
  {
    name: 'Seasoned Trainer',
    type: 'matches',
    threshold: 10,
    description: 'Play 10 matches and unlock rare Pokémon!',
    rewards: { milestonePoints: 100, bonusPoints: 25, pokemonUnlocks: [6] } // Charizard
  },
  {
    name: 'Battle Master',
    type: 'matches',
    threshold: 25,
    description: 'A true master plays 25 battles.',
    rewards: { milestonePoints: 250, bonusPoints: 50, pokemonUnlocks: [150] } // Mewtwo
  },
  {
    name: 'First Victory',
    type: 'wins',
    threshold: 1,
    description: 'Win your first battle.',
    rewards: { milestonePoints: 30, bonusPoints: 0, pokemonUnlocks: [] }
  },
  {
    name: 'Winning Streak',
    type: 'wins',
    threshold: 10,
    description: 'Win 10 matches total.',
    rewards: { milestonePoints: 150, bonusPoints: 30, pokemonUnlocks: [149] } // Dragonite
  },
  {
    name: 'Point Collector',
    type: 'points',
    threshold: 100,
    description: 'Earn 100 milestone points.',
    rewards: { milestonePoints: 0, bonusPoints: 50, pokemonUnlocks: [59] } // Arcanine
  },
  {
    name: 'Social Trainer',
    type: 'referrals',
    threshold: 1,
    description: 'Refer your first friend to battle!',
    rewards: { milestonePoints: 75, bonusPoints: 25, pokemonUnlocks: [131] } // Lapras
  },
  {
    name: 'Community Leader',
    type: 'referrals',
    threshold: 5,
    description: 'Refer 5 friends to the battle arena.',
    rewards: { milestonePoints: 200, bonusPoints: 50, pokemonUnlocks: [143] } // Snorlax
  }
];

export const initializeAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pokemon.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = await User.create({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });

      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   ⚠️  Please change the admin password in production!`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Seed default milestones if none exist
    const existingMilestones = await Milestone.countDocuments();
    if (existingMilestones === 0) {
      await Milestone.insertMany(DEFAULT_MILESTONES);
      console.log(`✅ Seeded ${DEFAULT_MILESTONES.length} default milestones`);
    } else {
      console.log(`ℹ️  Milestones already exist (${existingMilestones} total)`);
    }
  } catch (error) {
    console.error('❌ Error initializing admin/milestones:', error);
  }
};

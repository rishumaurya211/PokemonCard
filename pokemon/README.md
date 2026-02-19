# Pokemon Battle Arena

A full-stack Pokemon battle game with user authentication, profiles, referrals, milestones, and real-time friend battles.

## Features

### Core Features
- 🔍 Search and browse Pokemon
- ⚔️ Battle with bots
- 🎯 Custom team selection
- 📊 Real-time battle system

### User Features
- 👤 User authentication (signup/login/logout)
- 📈 Profile & statistics tracking
- 🏆 Milestone points system
- 🎁 Pokemon unlock system
- 👥 Referral system
- ⚔️ Friend vs Friend battles (real-time)

### Admin Features
- 📊 Admin dashboard
- 👥 User management
- 🔍 Match history
- 📈 Referral statistics
- 🎮 Pokemon management
- ⚙️ Milestone configuration

## Tech Stack

### Frontend
- React 19
- Vite
- Socket.io-client (for real-time battles)

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Socket.io (for real-time battles)
- JWT (authentication)
- bcryptjs (password hashing)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd pokemon/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pokemon-battle
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@pokemon.com
ADMIN_PASSWORD=admin123
CLIENT_URL=http://localhost:5173
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the main pokemon directory:
```bash
cd pokemon
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the pokemon directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Admin Credentials

- Email: `admin@pokemon.com`
- Password: `admin123`

**⚠️ Important: Change these credentials in production!**

## Database Schema

### Users
- Authentication (username, email, password)
- Stats (matches, wins, losses, win percentage)
- Milestone points
- Unlocked Pokemon
- Referral code and referrals

### Matches
- Player teams
- Round-by-round history
- Final scores and winner
- Match type (vs-bot, vs-friend, custom)

### Referrals
- Referrer and referred user
- Rewards tracking

### Milestones
- Different types (matches, points, wins, referrals)
- Thresholds and rewards
- Pokemon unlocks

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/battle-history` - Get battle history
- `GET /api/users/stats` - Get detailed statistics

### Matches
- `POST /api/matches/create` - Create a new match
- `POST /api/matches/:id/complete` - Complete a match
- `GET /api/matches/:id` - Get match details

### Referrals
- `GET /api/referrals/my-referral-code` - Get referral code
- `GET /api/referrals/my-referrals` - Get referred users
- `POST /api/referrals/validate` - Validate referral code

### Milestones
- `GET /api/milestones` - Get all milestones
- `GET /api/milestones/my-progress` - Get user progress

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `GET /api/admin/matches` - Get all matches
- `GET /api/admin/referrals` - Get all referrals
- `GET /api/admin/milestones` - Get all milestones
- `POST /api/admin/milestones` - Create milestone

## Socket.io Events

### Client → Server
- `join-battle-room` - Join a battle room
- `battle-action` - Send battle action

### Server → Client
- `room-update` - Room status update
- `battle-ready` - Battle is ready to start
- `battle-action` - Receive battle action
- `player-left` - Other player left

## Project Structure

```
pokemon/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── utils/           # Utilities
│   └── server.js        # Server entry point
├── src/
│   ├── components/      # React components
│   │   ├── Auth/        # Authentication components
│   │   ├── Profile/     # User profile
│   │   └── Admin/       # Admin panel
│   ├── context/         # React context
│   ├── services/        # API and Socket services
│   └── App.jsx          # Main app component
└── README.md
```

## Features in Detail

### Milestone System
Users earn milestone points after each match. Reaching certain milestones unlocks:
- New Pokemon
- Bonus points
- Special rewards

Milestones can be based on:
- Number of matches played
- Total milestone points
- Number of wins
- Number of referrals

### Referral System
- Each user gets a unique referral code
- New users can sign up with a referral code
- Both referrer and referred user get rewards
- Track all referrals in profile

### Friend Battles
- Create a battle room with a unique code
- Share code with friend
- Real-time battle using Socket.io
- Both players make moves simultaneously

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Protected routes with middleware
- Input validation on all endpoints
- Admin-only routes protected

## Development

### Running in Development
```bash
# Backend (in backend directory)
npm run dev

# Frontend (in pokemon directory)
npm run dev
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
npm start
```

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

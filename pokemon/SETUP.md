# Setup Guide

## Quick Start

1. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in backend/.env
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm install
   # Create .env file (see backend/.env.example)
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   # In pokemon directory
   npm install
   # Create .env file with VITE_API_URL and VITE_SOCKET_URL
   npm run dev
   ```

4. **Access the App**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## First Time Setup

### Backend Environment Variables

Create `backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pokemon-battle
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@pokemon.com
ADMIN_PASSWORD=admin123
CLIENT_URL=http://localhost:5173
```

### Frontend Environment Variables

Create `pokemon/.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Admin Access

After starting the backend, the admin user will be automatically created:
- Email: `admin@pokemon.com`
- Password: `admin123`

**Change these in production!**

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env
- For MongoDB Atlas, use the connection string provided

### Port Already in Use
- Change PORT in backend/.env
- Update VITE_API_URL and VITE_SOCKET_URL in frontend/.env accordingly

### CORS Errors
- Ensure CLIENT_URL in backend/.env matches your frontend URL
- Check that frontend is running on the correct port

### Socket.io Connection Issues
- Verify VITE_SOCKET_URL in frontend/.env
- Check that backend Socket.io server is running
- Ensure ports match between frontend and backend configs

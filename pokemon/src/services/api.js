const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  signup: (userData) => apiRequest('/auth/signup', {
    method: 'POST',
    body: userData
  }),
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials
  }),
  getCurrentUser: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// User API
export const userAPI = {
  getProfile: () => apiRequest('/users/profile'),
  getBattleHistory: (page = 1, limit = 20) => 
    apiRequest(`/users/battle-history?page=${page}&limit=${limit}`),
  getUnlockedPokemon: () => apiRequest('/users/unlocked-pokemon'),
  getStats: () => apiRequest('/users/stats')
};

// Match API
export const matchAPI = {
  createMatch: (matchData) => apiRequest('/matches/create', {
    method: 'POST',
    body: matchData
  }),
  completeMatch: (matchId, matchResult) => apiRequest(`/matches/${matchId}/complete`, {
    method: 'POST',
    body: matchResult
  }),
  getMatch: (matchId) => apiRequest(`/matches/${matchId}`)
};

// Pokemon API
export const pokemonAPI = {
  getPokemon: (pokemonIds) => {
    const ids = pokemonIds.join(',');
    return apiRequest(`/pokemon?pokemonIds=${ids}`);
  },
  checkUnlock: (pokemonId) => apiRequest(`/pokemon/check-unlock/${pokemonId}`),
  unlockPokemon: (pokemonId) => apiRequest('/pokemon/unlock', {
    method: 'POST',
    body: { pokemonId }
  })
};

// Referral API
export const referralAPI = {
  getMyReferralCode: () => apiRequest('/referrals/my-referral-code'),
  getMyReferrals: () => apiRequest('/referrals/my-referrals'),
  getReferralStats: () => apiRequest('/referrals/stats'),
  validateReferralCode: (code) => apiRequest('/referrals/validate', {
    method: 'POST',
    body: { referralCode: code }
  })
};

// Milestone API
export const milestoneAPI = {
  getMilestones: () => apiRequest('/milestones'),
  getMyProgress: () => apiRequest('/milestones/my-progress')
};

// Battle Rooms API
export const battleRoomAPI = {
  createRoom: () => apiRequest('/battle-rooms/create', {
    method: 'POST'
  }),
  joinRoom: (roomCode) => apiRequest('/battle-rooms/join', {
    method: 'POST',
    body: { roomCode }
  }),
  getRoom: (roomId) => apiRequest(`/battle-rooms/${roomId}`),
  getRoomByCode: (roomCode) => apiRequest(`/battle-rooms/get-by-code/${roomCode}`),
  submitTeam: (roomId, pokemonTeam) => apiRequest('/battle-rooms/submit-team', {
    method: 'POST',
    body: { roomId, pokemonTeam }
  }),
  getOpponentTeam: (roomId) => apiRequest(`/battle-rooms/${roomId}/opponent-team`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => apiRequest('/admin/dashboard'),
  getUsers: (page = 1, limit = 20) => 
    apiRequest(`/admin/users?page=${page}&limit=${limit}`),
  getUser: (userId) => apiRequest(`/admin/users/${userId}`),
  banUser: (userId, isBanned, reason) => apiRequest(`/admin/users/${userId}/ban`, {
    method: 'PUT',
    body: { isBanned, reason }
  }),
  deleteUser: (userId) => apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE'
  }),
  getMatches: (page = 1, limit = 20) => 
    apiRequest(`/admin/matches?page=${page}&limit=${limit}`),
  getReferrals: () => apiRequest('/admin/referrals'),
  getMilestones: () => apiRequest('/admin/milestones'),
  createMilestone: (milestone) => apiRequest('/admin/milestones', {
    method: 'POST',
    body: milestone
  }),
  updateMilestone: (milestoneId, updates) => apiRequest(`/admin/milestones/${milestoneId}`, {
    method: 'PUT',
    body: updates
  }),
  deleteMilestone: (milestoneId) => apiRequest(`/admin/milestones/${milestoneId}`, {
    method: 'DELETE'
  }),
  addPokemon: (pokemonData) => apiRequest('/admin/pokemon', {
    method: 'POST',
    body: pokemonData
  })
};

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

/**
 * Full-featured Admin Panel with:
 * - Dashboard stats + recent activity
 * - User management (ban/unban, delete)
 * - Match history viewer
 * - Referral stats
 * - Milestone CRUD
 * - Pokémon management
 */
const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [matches, setMatches] = useState([]);
  const [matchesPagination, setMatchesPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [referrals, setReferrals] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userSearch, setUserSearch] = useState('');

  // Milestone form state
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    type: 'matches',
    threshold: '',
    description: '',
    milestonePoints: '',
    bonusPoints: '',
  });

  // Pokemon form state
  const [pokemonForm, setPokemonForm] = useState({
    pokemonId: '',
    name: '',
    isLocked: false,
    rarity: 'common',
  });

  // Guard: only admins
  useEffect(() => {
    if (user?.role !== 'admin') {
      onClose();
    }
  }, [user, onClose]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  // ===== LOADERS =====
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboard();
      setDashboard(data);
    } catch (e) {
      showMessage('error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      const data = await adminAPI.getUsers(page, 15);
      setUsers(data.users || []);
      setUsersPagination(data.pagination || { page: 1, pages: 1 });
    } catch (e) {
      showMessage('error', 'Failed to load users');
    }
  }, []);

  const loadMatches = useCallback(async (page = 1) => {
    try {
      const data = await adminAPI.getMatches(page, 15);
      setMatches(data.matches || []);
      setMatchesPagination(data.pagination || { page: 1, pages: 1 });
    } catch (e) {
      showMessage('error', 'Failed to load matches');
    }
  }, []);

  const loadReferrals = useCallback(async () => {
    try {
      const data = await adminAPI.getReferrals();
      setReferrals(data.referrals || []);
    } catch (e) {
      showMessage('error', 'Failed to load referrals');
    }
  }, []);

  const loadMilestones = useCallback(async () => {
    try {
      const data = await adminAPI.getMilestones();
      setMilestones(data.milestones || []);
    } catch (e) {
      showMessage('error', 'Failed to load milestones');
    }
  }, []);

  // Initial load & tab switch loads
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers(1);
    if (activeTab === 'matches') loadMatches(1);
    if (activeTab === 'referrals') loadReferrals();
    if (activeTab === 'milestones') loadMilestones();
  }, [activeTab]);

  // ===== ACTIONS =====
  const handleBanToggle = async (u) => {
    if (!window.confirm(`Are you sure you want to ${u.isBanned ? 'unban' : 'ban'} ${u.username}?`)) return;
    setActionLoading(true);
    try {
      await adminAPI.banUser(u._id, !u.isBanned, u.isBanned ? '' : 'Admin action');
      showMessage('success', `User ${u.isBanned ? 'unbanned' : 'banned'} successfully`);
      loadUsers(usersPagination.page);
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`⚠️ Permanently delete user "${u.username}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(u._id);
      showMessage('success', 'User deleted successfully');
      loadUsers(usersPagination.page);
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.name || !milestoneForm.threshold) {
      showMessage('error', 'Name and Threshold are required');
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.createMilestone({
        name: milestoneForm.name,
        type: milestoneForm.type,
        threshold: Number(milestoneForm.threshold),
        description: milestoneForm.description,
        rewards: {
          milestonePoints: Number(milestoneForm.milestonePoints) || 0,
          bonusPoints: Number(milestoneForm.bonusPoints) || 0,
        }
      });
      showMessage('success', 'Milestone created!');
      setMilestoneForm({ name: '', type: 'matches', threshold: '', description: '', milestonePoints: '', bonusPoints: '' });
      loadMilestones();
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm('Delete this milestone?')) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteMilestone(id);
      showMessage('success', 'Milestone deleted');
      loadMilestones();
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPokemon = async (e) => {
    e.preventDefault();
    if (!pokemonForm.pokemonId || !pokemonForm.name) {
      showMessage('error', 'Pokémon ID and Name are required');
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.addPokemon({
        pokemonId: Number(pokemonForm.pokemonId),
        name: pokemonForm.name.toLowerCase(),
        isLocked: pokemonForm.isLocked,
        rarity: pokemonForm.rarity,
      });
      showMessage('success', `Pokémon #${pokemonForm.pokemonId} saved!`);
      setPokemonForm({ pokemonId: '', name: '', isLocked: false, rarity: 'common' });
    } catch (e) {
      showMessage('error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered users by search
  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'matches', icon: '⚔️', label: 'Matches' },
    { id: 'referrals', icon: '🔗', label: 'Referrals' },
    { id: 'milestones', icon: '🏆', label: 'Milestones' },
    { id: 'pokemon', icon: '🎮', label: 'Pokémon' },
  ];

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="admin-panel">
        <div className="admin-loading">
          <span style={{fontSize:'4rem'}}>⚡</span>
          Loading Admin Panel...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Top Bar */}
      <div className="admin-top-bar">
        <div className="admin-brand">
          <div className="admin-brand-icon">🔧</div>
          <div>
            <div className="admin-brand-title">⚡ Pokemon Battle Arena</div>
            <div className="admin-brand-subtitle">Admin Control Panel</div>
          </div>
        </div>
        <button className="admin-close" onClick={onClose} aria-label="Close Admin">×</button>
      </div>

      <div className="admin-body">
        {/* Sidebar */}
        <nav className="admin-sidebar">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              id={`admin-nav-${item.id}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="admin-content">
          {/* Global Messages */}
          {message.text && (
            <div className={message.type === 'error' ? 'admin-error-message' : 'admin-success-message'}>
              {message.type === 'error' ? '⚠️ ' : '✅ '}{message.text}
            </div>
          )}

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && dashboard && (
            <div>
              <h2 className="admin-section-title">📊 Dashboard Overview</h2>
              <div className="stats-grid">
                {[
                  { icon: '👥', label: 'Total Users', value: dashboard.stats?.totalUsers },
                  { icon: '🎮', label: 'Active Users', value: dashboard.stats?.activeUsers },
                  { icon: '⚔️', label: 'Total Matches', value: dashboard.stats?.totalMatches },
                  { icon: '🔗', label: 'Referrals', value: dashboard.stats?.totalReferrals },
                  { icon: '🚫', label: 'Banned Users', value: dashboard.stats?.bannedUsers },
                ].map(({ icon, label, value }) => (
                  <div className="stat-card" key={label}>
                    <span className="stat-icon">{icon}</span>
                    <h3>{label}</h3>
                    <p>{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              <div className="recent-grid">
                <div className="recent-card">
                  <h3>👤 Recent Signups</h3>
                  {dashboard.recentActivity?.users?.map((u) => (
                    <div className="recent-item" key={u._id}>
                      <span className="recent-item-name">{u.username}</span>
                      <span className="recent-item-date">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!dashboard.recentActivity?.users?.length) && (
                    <p style={{color:'rgba(255,255,255,0.3)', fontSize:'1.3rem'}}>No recent users</p>
                  )}
                </div>
                <div className="recent-card">
                  <h3>⚔️ Recent Matches</h3>
                  {dashboard.recentActivity?.matches?.map((m) => (
                    <div className="recent-item" key={m._id}>
                      <span className="recent-item-name">
                        {m.player1?.username} vs {m.player2?.username}
                      </span>
                      <span className="recent-item-date">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!dashboard.recentActivity?.matches?.length) && (
                    <p style={{color:'rgba(255,255,255,0.3)', fontSize:'1.3rem'}}>No recent matches</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div>
              <h2 className="admin-section-title">👥 User Management</h2>
              <input
                type="text"
                className="admin-search-bar"
                placeholder="🔍 Search by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Matches</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td><strong style={{color:'#fff'}}>{u.username}</strong></td>
                        <td style={{color:'rgba(255,255,255,0.5)'}}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'admin' : 'active'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.stats?.matchesPlayed || 0}</td>
                        <td>{u.milestonePoints || 0}</td>
                        <td>
                          <span className={`badge ${u.isBanned ? 'ban' : 'active'}`}>
                            {u.isBanned ? '🚫 Banned' : '✅ Active'}
                          </span>
                        </td>
                        <td style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                          {u.role !== 'admin' && (
                            <>
                              <button
                                className={`action-btn ${u.isBanned ? 'success' : 'danger'}`}
                                onClick={() => handleBanToggle(u)}
                                disabled={actionLoading}
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => handleDeleteUser(u)}
                                disabled={actionLoading}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {u.role === 'admin' && (
                            <span style={{color:'rgba(255,255,255,0.3)', fontSize:'1.2rem'}}>Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{textAlign:'center', color:'rgba(255,255,255,0.3)', padding:'30px'}}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <button
                  onClick={() => loadUsers(usersPagination.page - 1)}
                  disabled={usersPagination.page <= 1}
                >
                  ← Prev
                </button>
                <span>Page {usersPagination.page} / {usersPagination.pages} ({usersPagination.total} total)</span>
                <button
                  onClick={() => loadUsers(usersPagination.page + 1)}
                  disabled={usersPagination.page >= usersPagination.pages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ===== MATCHES ===== */}
          {activeTab === 'matches' && (
            <div>
              <h2 className="admin-section-title">⚔️ Match History</h2>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Player 1</th>
                      <th>Player 2</th>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Winner</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m._id}>
                        <td><strong style={{color:'#fff'}}>{m.player1?.username}</strong></td>
                        <td>{m.player2?.username}</td>
                        <td>
                          <span style={{
                            background:'rgba(102,126,234,0.15)',
                            color:'#818cf8',
                            padding:'3px 10px',
                            borderRadius:'12px',
                            fontSize:'1.1rem',
                            fontWeight:'700'
                          }}>
                            {m.matchType}
                          </span>
                        </td>
                        <td>{m.finalScore?.player1 ?? '—'} – {m.finalScore?.player2 ?? '—'}</td>
                        <td>
                          <span style={{
                            color: m.winner === 'draw' ? '#fbbf24' : '#4ade80',
                            fontWeight:'700'
                          }}>
                            {m.winner === 'player1' ? m.player1?.username :
                             m.winner === 'player2' ? m.player2?.username : '🤝 Draw'}
                          </span>
                        </td>
                        <td style={{color:'rgba(255,255,255,0.4)', fontSize:'1.2rem'}}>
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {matches.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{textAlign:'center', color:'rgba(255,255,255,0.3)', padding:'30px'}}>
                          No matches found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <button
                  onClick={() => loadMatches(matchesPagination.page - 1)}
                  disabled={matchesPagination.page <= 1}
                >
                  ← Prev
                </button>
                <span>Page {matchesPagination.page} / {matchesPagination.pages} ({matchesPagination.total} total)</span>
                <button
                  onClick={() => loadMatches(matchesPagination.page + 1)}
                  disabled={matchesPagination.page >= matchesPagination.pages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ===== REFERRALS ===== */}
          {activeTab === 'referrals' && (
            <div>
              <h2 className="admin-section-title">🔗 Referral Stats</h2>
              <div className="stats-grid" style={{marginBottom:'24px'}}>
                <div className="stat-card">
                  <span className="stat-icon">🔗</span>
                  <h3>Total Referrals</h3>
                  <p>{referrals.length}</p>
                </div>
              </div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Referrer</th>
                      <th>Referred User</th>
                      <th>Code</th>
                      <th>Points Awarded</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r._id}>
                        <td><strong style={{color:'#fff'}}>{r.referrer?.username}</strong></td>
                        <td>{r.referredUser?.username}</td>
                        <td>
                          <span style={{
                            fontFamily:'monospace',
                            letterSpacing:'2px',
                            color:'#818cf8',
                            fontWeight:'700',
                            fontSize:'1.3rem'
                          }}>
                            {r.referralCode}
                          </span>
                        </td>
                        <td style={{color:'#fbbf24'}}>
                          Referrer: {r.milestonePointsAwarded?.referrer || 100}pts |
                          User: {r.milestonePointsAwarded?.referredUser || 50}pts
                        </td>
                        <td style={{color:'rgba(255,255,255,0.4)', fontSize:'1.2rem'}}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {referrals.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{textAlign:'center', color:'rgba(255,255,255,0.3)', padding:'30px'}}>
                          No referrals yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== MILESTONES ===== */}
          {activeTab === 'milestones' && (
            <div>
              <h2 className="admin-section-title">🏆 Milestone Management</h2>

              {/* Create Milestone Form */}
              <div className="add-milestone-form">
                <h3>➕ Create New Milestone</h3>
                <form onSubmit={handleCreateMilestone}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={milestoneForm.name}
                        onChange={(e) => setMilestoneForm(f => ({...f, name: e.target.value}))}
                        placeholder="First Victory!"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Type *</label>
                      <select
                        value={milestoneForm.type}
                        onChange={(e) => setMilestoneForm(f => ({...f, type: e.target.value}))}
                      >
                        <option value="matches">Matches Played</option>
                        <option value="wins">Wins</option>
                        <option value="points">Points Earned</option>
                        <option value="referrals">Referrals Made</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Threshold *</label>
                      <input
                        type="number"
                        value={milestoneForm.threshold}
                        onChange={(e) => setMilestoneForm(f => ({...f, threshold: e.target.value}))}
                        placeholder="e.g. 5"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Reward Points</label>
                      <input
                        type="number"
                        value={milestoneForm.milestonePoints}
                        onChange={(e) => setMilestoneForm(f => ({...f, milestonePoints: e.target.value}))}
                        placeholder="e.g. 50"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bonus Points</label>
                      <input
                        type="number"
                        value={milestoneForm.bonusPoints}
                        onChange={(e) => setMilestoneForm(f => ({...f, bonusPoints: e.target.value}))}
                        placeholder="e.g. 25"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={milestoneForm.description}
                        onChange={(e) => setMilestoneForm(f => ({...f, description: e.target.value}))}
                        placeholder="Play your first 5 matches!"
                      />
                    </div>
                  </div>
                  <button type="submit" className="primary-btn" disabled={actionLoading}>
                    {actionLoading ? '⏳ Saving...' : '✅ Create Milestone'}
                  </button>
                </form>
              </div>

              {/* Existing Milestones */}
              <div className="milestones-grid">
                {milestones.map((m) => (
                  <div className="milestone-card" key={m._id}>
                    <h4>{m.name}</h4>
                    <p>Type: <strong style={{color:'#818cf8'}}>{m.type}</strong> | Threshold: <strong style={{color:'#fbbf24'}}>{m.threshold}</strong></p>
                    {m.description && <p style={{opacity:0.7}}>{m.description}</p>}
                    <p>
                      Rewards: {m.rewards?.milestonePoints ? `${m.rewards.milestonePoints} pts` : '0 pts'}
                      {m.rewards?.bonusPoints > 0 ? ` + ${m.rewards.bonusPoints} bonus` : ''}
                    </p>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDeleteMilestone(m._id)}
                      disabled={actionLoading}
                      style={{marginTop:'12px'}}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p style={{color:'rgba(255,255,255,0.3)', fontSize:'1.4rem', gridColumn:'1/-1'}}>
                    No milestones yet. Create one above!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ===== POKÉMON ===== */}
          {activeTab === 'pokemon' && (
            <div>
              <h2 className="admin-section-title">🎮 Pokémon Management</h2>

              <div className="add-milestone-form">
                <h3>➕ Add / Update Pokémon Lock Status</h3>
                <p style={{color:'rgba(255,255,255,0.45)', fontSize:'1.3rem', marginBottom:'18px'}}>
                  Use the Pokémon ID from PokéAPI (e.g. 1 = Bulbasaur). Setting a Pokémon as locked means
                  it will require milestone completion to unlock.
                </p>
                <form onSubmit={handleAddPokemon}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pokémon ID *</label>
                      <input
                        type="number"
                        value={pokemonForm.pokemonId}
                        onChange={(e) => setPokemonForm(f => ({...f, pokemonId: e.target.value}))}
                        placeholder="e.g. 25 (Pikachu)"
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={pokemonForm.name}
                        onChange={(e) => setPokemonForm(f => ({...f, name: e.target.value}))}
                        placeholder="e.g. pikachu"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Rarity</label>
                      <select
                        value={pokemonForm.rarity}
                        onChange={(e) => setPokemonForm(f => ({...f, rarity: e.target.value}))}
                      >
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                      </select>
                    </div>
                    <div className="form-group" style={{display:'flex', alignItems:'flex-end'}}>
                      <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                        <input
                          type="checkbox"
                          checked={pokemonForm.isLocked}
                          onChange={(e) => setPokemonForm(f => ({...f, isLocked: e.target.checked}))}
                          style={{width:'18px', height:'18px', accentColor:'#818cf8'}}
                        />
                        <span style={{color:'rgba(255,255,255,0.7)', fontSize:'1.35rem'}}>Set as Locked</span>
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="primary-btn" disabled={actionLoading}>
                    {actionLoading ? '⏳ Saving...' : '💾 Save Pokémon'}
                  </button>
                </form>
              </div>

              <div style={{
                padding:'20px',
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'16px'
              }}>
                <h3 style={{color:'rgba(255,255,255,0.7)', fontSize:'1.4rem', margin:'0 0 14px 0'}}>
                  ℹ️ How Pokémon Locking Works
                </h3>
                <ul style={{padding:'0 0 0 10px', listStyle:'none', display:'flex', flexDirection:'column', gap:'10px'}}>
                  {[
                    '🔓 All Pokémon are available by default unless marked as locked',
                    '🏆 Locked Pokémon unlock automatically when users reach milestone thresholds',
                    '🔗 Users can also unlock Pokémon through referral rewards',
                    '⭐ Rarity determines how special the Pokémon appears in the UI',
                    '🎮 Admins always have access to all Pokémon regardless of lock status',
                  ].map((text, i) => (
                    <li key={i} style={{color:'rgba(255,255,255,0.5)', fontSize:'1.3rem'}}>{text}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

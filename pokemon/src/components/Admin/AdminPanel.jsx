import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'admin') {
      onClose();
      return;
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'matches') loadMatches();
    if (activeTab === 'milestones') loadMilestones();
  }, [activeTab, page]);

  const loadDashboard = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminAPI.getUsers(page, 20);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await adminAPI.getMatches(page, 20);
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const loadMilestones = async () => {
    try {
      const data = await adminAPI.getMilestones();
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const handleBanUser = async (userId, isBanned, reason) => {
    try {
      await adminAPI.banUser(userId, isBanned, reason);
      loadUsers();
    } catch (error) {
      alert('Failed to update user: ' + error.message);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="admin-panel">
        <div className="admin-content">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-content">
        <button className="admin-close" onClick={onClose}>×</button>
        <h1>Admin Panel</h1>

        <div className="admin-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'matches' ? 'active' : ''}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
          <button
            className={activeTab === 'milestones' ? 'active' : ''}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones
          </button>
        </div>

        <div className="admin-tab-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p>{dashboard.stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Users</h3>
                  <p>{dashboard.stats.activeUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Matches</h3>
                  <p>{dashboard.stats.totalMatches}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Referrals</h3>
                  <p>{dashboard.stats.totalReferrals}</p>
                </div>
                <div className="stat-card">
                  <h3>Banned Users</h3>
                  <p>{dashboard.stats.bannedUsers}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Matches</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users?.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.stats?.matchesPlayed || 0}</td>
                      <td>
                        {u.isBanned ? (
                          <span className="badge ban">Banned</span>
                        ) : (
                          <span className="badge active">Active</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleBanUser(u._id, !u.isBanned, 'Admin action')}
                          className="action-btn"
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="matches-section">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Type</th>
                    <th>Winner</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.matches?.map((m) => (
                    <tr key={m._id}>
                      <td>{m.player1?.username}</td>
                      <td>{m.player2?.username}</td>
                      <td>{m.matchType}</td>
                      <td>{m.winner}</td>
                      <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="milestones-section">
              <div className="milestones-list">
                {milestones.map((m) => (
                  <div key={m._id} className="milestone-item">
                    <h4>{m.name}</h4>
                    <p>Type: {m.type} | Threshold: {m.threshold}</p>
                    <p>Rewards: {m.rewards?.milestonePoints || 0} points</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

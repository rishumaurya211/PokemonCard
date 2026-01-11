import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, referralAPI, milestoneAPI } from '../../services/api';
import './Profile.css';

const UserProfile = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [profile, setProfile] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, historyData, referralData, milestoneData] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getBattleHistory(1, 10),
        referralAPI.getReferralStats(),
        milestoneAPI.getMilestones()
      ]);

      setProfile(profileData.user);
      setBattleHistory(historyData.matches || []);
      setReferralStats(referralData.stats);
      setMilestones(milestoneData.milestones || []);
      updateUser(profileData.user);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-modal">
        <div className="profile-content">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-modal">
      <div className="profile-content">
        <button className="profile-close" onClick={onClose}>×</button>
        <div className="profile-header">
          <h2>{profile?.username}</h2>
          <p className="profile-email">{profile?.email}</p>
        </div>

        <div className="profile-tabs">
          <button
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
          <button
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            Battle History
          </button>
          <button
            className={activeTab === 'referrals' ? 'active' : ''}
            onClick={() => setActiveTab('referrals')}
          >
            Referrals
          </button>
          <button
            className={activeTab === 'milestones' ? 'active' : ''}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === 'stats' && (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Matches Played</h3>
                  <p className="stat-value">{profile?.stats?.matchesPlayed || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Wins</h3>
                  <p className="stat-value win">{profile?.stats?.wins || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Losses</h3>
                  <p className="stat-value loss">{profile?.stats?.losses || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Win Rate</h3>
                  <p className="stat-value">{profile?.stats?.winPercentage || 0}%</p>
                </div>
                <div className="stat-card">
                  <h3>Milestone Points</h3>
                  <p className="stat-value">{profile?.milestonePoints || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Pokemon Unlocked</h3>
                  <p className="stat-value">{profile?.unlockedPokemon?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              {battleHistory.length === 0 ? (
                <p className="empty-state">No battle history yet</p>
              ) : (
                <div className="history-list">
                  {battleHistory.map((match, index) => (
                    <div key={index} className="history-item">
                      <div className="history-match-type">{match.matchType}</div>
                      <div className="history-players">
                        {match.player1.username} vs {match.player2.username}
                      </div>
                      <div className="history-score">
                        {match.finalScore.player1} - {match.finalScore.player2}
                      </div>
                      <div className={`history-result ${match.winner}`}>
                        {match.winner === 'player1' && match.player1.username === profile.username
                          ? 'Won'
                          : match.winner === 'player2' && match.player2.username === profile.username
                          ? 'Won'
                          : match.winner === 'draw'
                          ? 'Draw'
                          : 'Lost'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="referrals-section">
              <div className="referral-code-box">
                <h3>Your Referral Code</h3>
                <div className="referral-code">{referralStats?.referralCode}</div>
                <p className="referral-link">{referralStats?.referralLink}</p>
                <button
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(referralStats?.referralLink);
                    alert('Copied to clipboard!');
                  }}
                >
                  Copy Link
                </button>
              </div>
              <div className="referral-stats">
                <div className="referral-stat">
                  <span>Total Referrals:</span>
                  <strong>{referralStats?.totalReferrals || 0}</strong>
                </div>
                <div className="referral-stat">
                  <span>Active Referrals:</span>
                  <strong>{referralStats?.activeReferrals || 0}</strong>
                </div>
              </div>
              {referralStats?.referredUsers?.length > 0 && (
                <div className="referred-users">
                  <h4>Referred Users</h4>
                  <ul>
                    {referralStats.referredUsers.map((refUser, index) => (
                      <li key={index}>{refUser.username}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="milestones-section">
              {milestones.length === 0 ? (
                <p className="empty-state">No milestones available</p>
              ) : (
                <div className="milestones-list">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className={`milestone-item ${milestone.achieved ? 'achieved' : ''}`}
                    >
                      <div className="milestone-header">
                        <h4>{milestone.name}</h4>
                        {milestone.achieved && <span className="badge">✓ Achieved</span>}
                      </div>
                      <p className="milestone-description">{milestone.description}</p>
                      <div className="milestone-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {milestone.current} / {milestone.threshold}
                        </span>
                      </div>
                      {milestone.achieved && (
                        <div className="milestone-rewards">
                          Rewards: {milestone.rewards.milestonePoints} points
                          {milestone.rewards.pokemonUnlocks?.length > 0 && (
                            <span>, {milestone.rewards.pokemonUnlocks.length} Pokemon unlock(s)</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

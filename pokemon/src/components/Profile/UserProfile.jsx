import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, referralAPI, milestoneAPI } from '../../services/api';
import './Profile.css';

const UserProfile = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [battleHistory, setBattleHistory] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, referralData, milestoneData] = await Promise.all([
        userAPI.getBattleHistory(1, 15),
        referralAPI.getReferralStats(),
        milestoneAPI.getMilestones()
      ]);

      setBattleHistory(historyData.matches || []);
      setReferralStats(referralData.stats);
      setMilestones(milestoneData.milestones || []);
      
      // Update global user state (this is now memoized)
      const profileData = await userAPI.getProfile();
      if (profileData.user) {
        updateUser(profileData.user);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleCopyLink = async () => {
    const link = referralStats?.referralLink || '';
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Link: ' + link);
    }
  };

  /**
   * Determine if the current user won, lost, or drew.
   * The history match stores player1/player2 usernames.
   */
  const getMatchResult = (match) => {
    if (!match || !user) return 'Draw';
    const myUsername = user?.username;
    const isPlayer1 = match.player1?.username === myUsername;
    const w = match.winner;
    if (w === 'draw') return 'Draw';
    if ((w === 'player1' && isPlayer1) || (w === 'player2' && !isPlayer1)) return 'Won';
    return 'Lost';
  };

  const getResultClass = (match) => {
    const result = getMatchResult(match);
    if (result === 'Won') return 'player1';
    if (result === 'Lost') return 'player2';
    return 'draw';
  };

  const tabs = [
    { id: 'stats', label: '📊 Stats' },
    { id: 'history', label: '⚔️ History' },
    { id: 'referrals', label: '🔗 Referrals' },
    { id: 'milestones', label: '🏆 Milestones' },
  ];

  if (loading) {
    return (
      <div className="profile-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="profile-content">
          <button className="profile-close" onClick={onClose}>×</button>
          <div className="profile-loading">
            <span>⚡</span> Loading trainer data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="profile-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose} aria-label="Close">×</button>

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <h2>{user?.username || 'Trainer'}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-meta-badges">
            <span className="profile-badge">
              🎮 {user?.stats?.matchesPlayed || 0} Battles
            </span>
            <span className="profile-badge points">
              ⭐ {user?.milestonePoints || 0} Points
            </span>
            <span className="profile-badge pokemon">
              🔓 {user?.unlockedPokemon?.length || 0} Pokémon
            </span>
            {user?.role === 'admin' && (
              <span className="profile-badge" style={{background:'rgba(255,107,107,0.25)', borderColor:'rgba(255,107,107,0.4)'}}>
                🔧 Admin
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-tab-content">

          {/* STATS */}
          {activeTab === 'stats' && (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Matches</h3>
                  <span className="stat-value">{user?.stats?.matchesPlayed || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Wins</h3>
                  <span className="stat-value win">{user?.stats?.wins || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Losses</h3>
                  <span className="stat-value loss">{user?.stats?.losses || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Draws</h3>
                  <span className="stat-value">{user?.stats?.draws || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Win Rate</h3>
                  <span className="stat-value">{user?.stats?.winPercentage || 0}%</span>
                </div>
                <div className="stat-card">
                  <h3>Points</h3>
                  <span className="stat-value" style={{color:'#fbbf24'}}>{user?.milestonePoints || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* BATTLE HISTORY */}
          {activeTab === 'history' && (
            <div className="history-section">
              {battleHistory.length === 0 ? (
                <p className="empty-state">🎮 No battles yet. Start your first match!</p>
              ) : (
                <div className="history-list">
                  {battleHistory.map((match, index) => {
                    const result = getMatchResult(match);
                    const resClass = getResultClass(match);
                    return (
                      <div key={match._id || index} className="history-item">
                        <div className="history-match-type">{match.matchType}</div>
                        <div className="history-players">
                          <strong>{match.player1?.username}</strong>
                          <span style={{color:'rgba(255,255,255,0.3)'}}> vs </span>
                          <strong>{match.player2?.username}</strong>
                        </div>
                        <div className="history-score">
                          {match.finalScore?.player1 ?? '—'} – {match.finalScore?.player2 ?? '—'}
                        </div>
                        <div className={`history-result ${resClass}`}>
                          {result === 'Won' ? '🏆 Won' : result === 'Lost' ? '💀 Lost' : '🤝 Draw'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REFERRALS */}
          {activeTab === 'referrals' && (
            <div className="referrals-section">
              <div className="referral-code-box">
                <h3>🔗 Your Referral Code</h3>
                <div className="referral-code">{referralStats?.referralCode || profile?.referralCode || '—'}</div>
                <span className="referral-link">{referralStats?.referralLink || '—'}</span>
                <button
                  className="copy-button"
                  onClick={handleCopyLink}
                  id="copy-referral-link-btn"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Invite Link'}
                </button>
              </div>

              <div className="referral-stats">
                <div className="referral-stat">
                  <span>Total Referrals</span>
                  <strong>{referralStats?.totalReferrals || 0}</strong>
                </div>
                <div className="referral-stat">
                  <span>Active Players</span>
                  <strong>{referralStats?.activeReferrals || 0}</strong>
                </div>
              </div>

              <div style={{padding:'16px', background:'rgba(255,165,0,0.08)', border:'1px solid rgba(255,165,0,0.2)', borderRadius:'14px', marginBottom:'20px'}}>
                <p style={{color:'#fbbf24', fontSize:'1.3rem', margin:'0'}}>
                  💰 You earn <strong>100 pts</strong> for each referral, your friend gets <strong>50 pts</strong> for signing up!
                </p>
              </div>

              {referralStats?.referredUsers?.length > 0 && (
                <div className="referred-users">
                  <h4>Referred Trainers ({referralStats.referredUsers.length})</h4>
                  <ul>
                    {referralStats.referredUsers.map((refUser, index) => (
                      <li key={refUser._id || index}>
                        <span style={{fontWeight:'700', color:'rgba(255,255,255,0.9)'}}>
                          {refUser.username}
                        </span>
                        <span style={{marginLeft:'auto', color:'rgba(255,255,255,0.35)', fontSize:'1.15rem'}}>
                          {refUser.stats?.matchesPlayed || 0} matches
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(!referralStats?.referredUsers?.length) && (
                <p className="empty-state">No referrals yet. Share your code with friends! 🚀</p>
              )}
            </div>
          )}

          {/* MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="milestones-section">
              {milestones.length === 0 ? (
                <p className="empty-state">🏆 No milestones configured yet. Check back later!</p>
              ) : (
                <div className="milestones-list">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone._id || index}
                      className={`milestone-item ${milestone.achieved ? 'achieved' : ''}`}
                    >
                      <div className="milestone-header">
                        <h4>{milestone.achieved ? '✅ ' : '🎯 '}{milestone.name}</h4>
                        {milestone.achieved && (
                          <span className="badge achieved">Achieved!</span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="milestone-description">{milestone.description}</p>
                      )}
                      <div className="milestone-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${milestone.progress || 0}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {milestone.current}/{milestone.threshold}
                        </span>
                      </div>
                      {milestone.rewards && (
                        <div className="milestone-rewards">
                          🎁 Reward: {milestone.rewards.milestonePoints > 0 && `${milestone.rewards.milestonePoints} pts`}
                          {milestone.rewards.bonusPoints > 0 && ` + ${milestone.rewards.bonusPoints} bonus pts`}
                          {milestone.rewards.pokemonUnlocks?.length > 0 && ` + ${milestone.rewards.pokemonUnlocks.length} Pokémon unlock(s)`}
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

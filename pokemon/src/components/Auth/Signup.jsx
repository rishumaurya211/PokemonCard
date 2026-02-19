import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { referralAPI } from '../../services/api';
import './Auth.css';

const Signup = ({ onSwitchToLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const { signup } = useAuth();

  // Check for referral code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode);
    }
  }, []);

  const validateReferralCode = async (code) => {
    if (!code || code.length < 4) return;
    setValidatingCode(true);
    try {
      const result = await referralAPI.validateReferralCode(code);
      if (result.success && result.valid) {
        setReferrerInfo(result.referrer);
      } else {
        setReferrerInfo(null);
      }
    } catch {
      setReferrerInfo(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleReferralChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(val);
    if (val.length >= 6) {
      validateReferralCode(val);
    } else {
      setReferrerInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signup({
      username,
      email,
      password,
      referralCode: referralCode || undefined
    });

    if (result.success) {
      if (onClose) onClose();
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>

        <div className="auth-logo-badge">
          <span>🎮</span>
        </div>

        <h2>Join the Arena</h2>

        {error && <div className="auth-error">{error}</div>}

        {referrerInfo && (
          <div className="auth-info">
            You were invited by <strong>{referrerInfo.username}</strong>! You'll get 50 bonus points on signup.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-username">Trainer Name</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="PokeTrainer123"
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trainer@pokemon.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-referral">
              Referral Code {validatingCode && <span style={{color:'rgba(255,255,255,0.4)', fontSize:'1.1rem'}}>(checking...)</span>}
              {referrerInfo && <span style={{color:'#69f0ae', fontSize:'1.1rem'}}> ✓ Valid!</span>}
              <span style={{color:'rgba(255,255,255,0.3)', fontWeight:'normal', fontSize:'1.1rem'}}> (Optional)</span>
            </label>
            <input
              id="signup-referral"
              type="text"
              value={referralCode}
              onChange={handleReferralChange}
              placeholder="e.g. ASH4BC1234"
              maxLength={15}
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading} id="signup-submit-btn">
            {loading ? '🔄 Creating account...' : '🚀 Start Your Journey'}
          </button>
        </form>

        <p className="auth-switch">
          Already a trainer?{' '}
          <button onClick={onSwitchToLogin} className="auth-link">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;

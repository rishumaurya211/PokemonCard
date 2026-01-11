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
  const { signup } = useAuth();

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, []);

  const validateReferralCode = async (code) => {
    if (!code) return;
    try {
      const result = await referralAPI.validateReferralCode(code);
      if (result.success && result.valid) {
        setReferrerInfo(result.referrer);
      }
    } catch (error) {
      // Invalid code, ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <button className="auth-close" onClick={onClose}>×</button>
        <h2>Sign Up</h2>
        {error && <div className="auth-error">{error}</div>}
        {referrerInfo && (
          <div className="auth-info">
            Referred by: <strong>{referrerInfo.username}</strong>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="Choose a username"
            />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="auth-field">
            <label>Referral Code (Optional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                if (e.target.value) {
                  validateReferralCode(e.target.value);
                } else {
                  setReferrerInfo(null);
                }
              }}
              placeholder="Enter referral code"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="auth-link">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;

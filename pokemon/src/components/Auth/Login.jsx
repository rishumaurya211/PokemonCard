import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToSignup, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      if (onClose) onClose();
    } else {
      setError(result.error || 'Login failed. Check your credentials.');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>

        <div className="auth-logo-badge">
          <span>⚡</span>
        </div>

        <h2>Welcome Back</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trainer@pokemon.com"
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading} id="login-submit-btn">
            {loading ? '🔄 Logging in...' : '⚡ Login & Battle'}
          </button>
        </form>

        <p className="auth-switch">
          New trainer?{' '}
          <button onClick={onSwitchToSignup} className="auth-link">
            Create an account
          </button>
        </p>

        {/* Quick hint for admin */}
        <div style={{
          marginTop: '16px',
          padding: '10px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '1.1rem',
          color: 'rgba(255,255,255,0.3)'
        }}>
          Admin? Use credentials from backend .env
        </div>
      </div>
    </div>
  );
};

export default Login;

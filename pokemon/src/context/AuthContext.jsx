import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on mount
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      
      // Connect socket for real-time features
      if (token) {
        connectSocket(token);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      connectSocket(response.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      connectSocket(response.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUser = React.useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser: loadUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

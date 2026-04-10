import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dealerpulse_token'));
  const [isLoading, setIsLoading] = useState(true);

  // 5.2 Standard fetch wrapper (apiFetch)
  const apiFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('dealerpulse_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      credentials: 'include', // Add this to send session cookies for CAPTCHA
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...options.headers,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { message: 'Failed to parse response' };
    }

    return { ok: res.ok, status: res.status, data };
  }, []);

  // Validation on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { ok, data } = await apiFetch('/api/auth/me');
        if (ok) {
          setUser(data.user);
        } else {
          // Token invalid or expired
          localStorage.removeItem('dealerpulse_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token, apiFetch]);

  const login = (newToken, userData = null) => {
    localStorage.setItem('dealerpulse_token', newToken);
    setToken(newToken);
    
    if (userData) {
      setUser(userData);
    } else {
      // Quick decode fallback
      try {
          const payload = JSON.parse(atob(newToken.split('.')[1]));
          setUser({ _id: payload.userId, email: payload.email });
      } catch (e) {
          console.error('JWT Decode failed', e);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('dealerpulse_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login'; // Force redirect as per SRS 6.33
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        token, 
        login, 
        logout, 
        isLoading, 
        apiFetch,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' // Preserving for admin routes
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,                  
  token: null,                 
  isAuthenticated: false,
  isLoading: true,             
  login: async (email, password, captchaToken) => {},
  register: async (name, email, password, captchaToken) => {},
  logout: () => {},
  isAdmin: () => false,        
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auditify_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('auditify_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const login = async (email, password, captchaToken) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        captchaToken
      });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('auditify_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed',
        code: error.response?.data?.code
      };
    }
  };

  const register = async (name, email, password, captchaToken) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        captchaToken
      });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('auditify_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed',
        code: error.response?.data?.code
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auditify_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

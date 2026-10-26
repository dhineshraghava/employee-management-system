import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin as apiAdminLogin, employeeLogin as apiEmployeeLogin, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ems_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ems_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token into localStorage & verify on startup
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('ems_token');
      if (savedToken) {
        try {
          const res = await getCurrentUser();
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('ems_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Saved token expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  // Cross-tab sync listener
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('ems_user');
        setUser(stored ? JSON.parse(stored) : null);
        setToken(localStorage.getItem('ems_token') || null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginAdmin = async (email, password) => {
    const res = await apiAdminLogin({ email, password });
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('ems_token', newToken);
      localStorage.setItem('ems_user', JSON.stringify(userData));
      localStorage.setItem('ems_role', 'admin');
      return userData;
    }
    throw new Error(res.data?.message || 'Admin login failed');
  };

  const loginEmployee = async (email, password) => {
    const res = await apiEmployeeLogin({ email, password });
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('ems_token', newToken);
      localStorage.setItem('ems_user', JSON.stringify(userData));
      localStorage.setItem('ems_role', 'employee');
      return userData;
    }
    throw new Error(res.data?.message || 'Employee login failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_role');
  };

  const currentRole = user?.role || localStorage.getItem('ems_role') || null;

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    isAdmin: currentRole === 'admin',
    isEmployee: currentRole === 'employee',
    loginAdmin,
    loginEmployee,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

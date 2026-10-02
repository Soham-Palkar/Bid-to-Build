import { useState, useEffect, useCallback } from 'react';

export interface AdminUser {
  username: string;
  name: string;
  node?: string;
}

const TOKEN_KEY = 'smartfix_admin_token';
const USER_KEY = 'smartfix_admin_user';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem(TOKEN_KEY));
      const raw = localStorage.getItem(USER_KEY);
      setAdmin(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback((newToken: string, adminUser: AdminUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
    setToken(newToken);
    setAdmin(adminUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  return {
    isAuthenticated: Boolean(token),
    token,
    admin,
    login,
    logout,
  };
}

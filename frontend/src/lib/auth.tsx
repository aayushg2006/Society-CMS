'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse } from './types';

interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  login: (auth: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isResident: boolean;
  isVendor: boolean;
  isSecretary: boolean;
}

export const getPortalPath = (role?: string) => {
  if (!role) return '/login';
  if (role === 'ADMIN' || role === 'SECRETARY' || role === 'SUPER_ADMIN') return '/admin';
  if (role === 'STAFF') return '/vendor';
  if (role === 'RESIDENT') return '/member';
  return '/login';
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  isAdmin: false,
  isStaff: false,
  isResident: false,
  isVendor: false,
  isSecretary: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('cms_token');
    const storedUser = localStorage.getItem('cms_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (auth: AuthResponse) => {
    setUser(auth);
    setToken(auth.token);
    localStorage.setItem('cms_token', auth.token);
    localStorage.setItem('cms_user', JSON.stringify(auth));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SECRETARY' || user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isVendor = isStaff;
  const isResident = user?.role === 'RESIDENT';
  const isSecretary = user?.role === 'SECRETARY';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAdmin, isStaff, isResident, isVendor, isSecretary }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

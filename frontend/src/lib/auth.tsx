'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from './api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  switchDemoUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('hyvora_token');
    const savedUser = localStorage.getItem('hyvora_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // verify token
        api.getMe()
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem('hyvora_user', JSON.stringify(freshUser));
          })
          .catch(() => {
            // If token invalid, clear
            localStorage.removeItem('hyvora_token');
            localStorage.removeItem('hyvora_user');
            setUser(null);
            setToken(null);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('hyvora_token', res.accessToken);
    localStorage.setItem('hyvora_user', JSON.stringify(res.user));
    router.push('/dashboard');
  };

  const switchDemoUser = async (email: string) => {
    const res = await api.login(email, 'password123');
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('hyvora_token', res.accessToken);
    localStorage.setItem('hyvora_user', JSON.stringify(res.user));
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('hyvora_token');
    localStorage.removeItem('hyvora_user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

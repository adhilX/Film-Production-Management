"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const storeAccessToken = useAuthStore((state) => state.accessToken);

  // Keep Context token synced with Zustand Store accessToken
  useEffect(() => {
    if (storeAccessToken !== token) {
      setToken(storeAccessToken);
    }
  }, [storeAccessToken, token]);

  useEffect(() => {
    let storedToken = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    if (!storedToken && typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.accessToken) {
            storedToken = parsed.state.accessToken;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      const remember = localStorage.getItem('remember_me') === 'true';
      if (remember) {
        localStorage.setItem('token', newToken);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', newToken);
        localStorage.removeItem('token');
      }
    }
  };

  const logout = () => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth-storage');
    }
    document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

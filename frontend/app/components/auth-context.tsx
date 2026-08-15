"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: (User & { permissions: string[] }) | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User & { permissions: string[] }) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { permissions: string[] }) | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let storedToken = localStorage.getItem('token');
    let storedUserStr = localStorage.getItem('user');

    if (!storedToken || !storedUserStr) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.accessToken && parsed?.state?.user) {
            storedToken = parsed.state.accessToken;
            storedUserStr = JSON.stringify(parsed.state.user);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (storedToken && storedUserStr) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUserStr);
        setUser({
          ...parsedUser,
          permissions: parsedUser.permissions || [],
        });
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User & { permissions: string[] }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');
    document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.systemRole === 'Admin') return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  const refreshStatus = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const latestUser = await res.json();
        const permissions = latestUser.roleId?.permissions || [];
        const updatedUser = {
          id: latestUser._id,
          email: latestUser.email,
          name: latestUser.name,
          contractorType: latestUser.contractorType,
          systemRole: latestUser.systemRole,
          status: latestUser.status,
          isActive: latestUser.isActive,
          permissions,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error('Failed to refresh onboarding status:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasPermission,
        refreshStatus,
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

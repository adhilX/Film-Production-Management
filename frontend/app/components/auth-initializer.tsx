"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from './auth-context';
import { authService } from '@/services/authService';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { loading: contextLoading } = useAuth();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [initializing, setInitializing] = useState(true);
  const fetchingTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (contextLoading) return;

    const loadProfile = async () => {
      if (token) {
        if (!user) {
          if (fetchingTokenRef.current === token) {
            return;
          }
          fetchingTokenRef.current = token;
          
          const decodeJwt = (t: string) => {
            try {
              const base64Url = t.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                window.atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              return JSON.parse(jsonPayload);
            } catch {
              return null;
            }
          };

          const decoded = decodeJwt(token);
          const userId = decoded?.userId;
          if (userId) {
            try {
              const data = await authService.getProfile(userId);
              setAuth(data, token);
            } catch (e) {
              console.error('Failed to load user profile on startup:', e);
              fetchingTokenRef.current = null;
              clearAuth();
            }
          } else {
            fetchingTokenRef.current = null;
            clearAuth();
          }
        }
      } else {
        fetchingTokenRef.current = null;
        if (user || useAuthStore.getState().accessToken) {
          clearAuth();
        }
      }
      setInitializing(false);
    };

    loadProfile();
  }, [token, contextLoading, user, setAuth, clearAuth]);

  if (contextLoading || (token && !user && initializing)) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

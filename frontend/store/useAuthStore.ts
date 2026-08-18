import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, LoginPayload } from '@/services/authService';
import type { UserProfile, LoginResponse } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<LoginResponse>;
  setAuth: (user: UserProfile, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearAuth: () => void;
  checkStatus: () => Promise<{ status: string; isActive: boolean; systemRoleId: string | null; onboardingStatus?: string; permissions?: string[] } | null>;
}

const setAuthCookie = () => {
  if (typeof document !== 'undefined') {
    const remember = typeof window !== 'undefined' ? localStorage.getItem('remember_me') === 'true' : false;
    if (remember) {
      document.cookie = 'refresh_token=true; path=/; max-age=604800; SameSite=Lax';
    } else {
      document.cookie = 'refresh_token=true; path=/; SameSite=Lax';
    }
  }
};

const removeAuthCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Lax';
  }
};

const setTokenInStorage = (token: string) => {
  if (typeof window !== 'undefined') {
    const remember = localStorage.getItem('remember_me') === 'true';
    if (remember) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }
};

const removeTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
};

const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginPayload) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          const { access_token } = response;
          
          setAuthCookie();
          setTokenInStorage(access_token);

          const decoded = decodeJwt(access_token);
          const userId = decoded?.userId;
          if (!userId) {
            throw new Error('Authentication token is missing user identity details');
          }

          // Set the token first so the Axios request interceptor attaches it
          set({ accessToken: access_token });

          const userProfile = await authService.getProfile(userId);

          set({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setAuth: (user: UserProfile, accessToken: string) => {
        setAuthCookie();
        setTokenInStorage(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setAccessToken: (accessToken: string) => {
        setTokenInStorage(accessToken);
        set({ accessToken });
      },

      clearAuth: () => {
        removeAuthCookie();
        removeTokenFromStorage();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('remember_me');
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      logout: async () => {
        const token = get().accessToken;
        if (token) {
          try {
            await authService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        get().clearAuth();
      },

      refreshToken: async () => {
        try {
          const data = await authService.refreshToken();
          const { access_token } = data;
          setAuthCookie();
          setTokenInStorage(access_token);
          set({ accessToken: access_token, isAuthenticated: true });
          return access_token;
        } catch (error) {
          get().clearAuth();
          return null;
        }
      },

      checkStatus: async () => {
        try {
          const statusData = await authService.getStatus();
          const currentUser = get().user;
          if (currentUser) {
            const hasPermissionsChanged = JSON.stringify(currentUser.permissions || []) !== JSON.stringify(statusData.permissions || []);
            const currentRoleIdStr = currentUser.systemRoleId?._id || (typeof currentUser.systemRoleId === 'string' ? currentUser.systemRoleId : null);
            const hasRoleIdChanged = currentRoleIdStr !== statusData.systemRoleId;
            if (
              currentUser.status !== statusData.status ||
              currentUser.isActive !== statusData.isActive ||
              hasRoleIdChanged ||
              currentUser.onboardingStatus !== statusData.onboardingStatus ||
              hasPermissionsChanged
            ) {
              const updatedUser = {
                ...currentUser,
                status: statusData.status,
                isActive: statusData.isActive,
                systemRoleId: statusData.systemRoleId ? { _id: statusData.systemRoleId, name: currentUser.systemRoleId?.name || '' } : undefined,
                onboardingStatus: statusData.onboardingStatus,
                permissions: statusData.permissions || [],
              };
              set({ user: updatedUser });
            }
          }
          return statusData;
        } catch (error) {
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          const remember = localStorage.getItem('remember_me') === 'true';
          return remember ? localStorage : sessionStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        } as any;
      }),
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

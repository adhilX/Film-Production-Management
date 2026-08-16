import { axiosClient } from '@/lib/axios';
import type { LoginResponse, SignupResponse, RefreshResponse, UserProfile } from '@/types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  contractorType: string;
}

export const authService = {
  /**
   * Authenticates user with email and password
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Fetches user profile by user ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await axiosClient.get<UserProfile>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Fetches current user onboarding status and active status
   */
  async getStatus(): Promise<{ status: string; isActive: boolean; systemRole: string }> {
    const response = await axiosClient.get<{ status: string; isActive: boolean; systemRole: string }>('/users/me/status');
    return response.data;
  },

  /**
   * Registers a new contractor application
   */
  async signup(payload: SignupPayload): Promise<SignupResponse> {
    const response = await axiosClient.post<SignupResponse>('/auth/signup', payload);
    return response.data;
  },

  /**
   * Rotates refresh token via HttpOnly cookie
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await axiosClient.post<RefreshResponse>('/auth/refresh');
    return response.data;
  },

  /**
   * Logs out user and clears HttpOnly refresh token cookie
   */
  async logout(): Promise<void> {
    await axiosClient.post('/auth/logout');
  },
};

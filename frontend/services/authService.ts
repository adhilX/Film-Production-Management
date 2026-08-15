import { axiosClient } from '@/lib/axios';
import type { LoginResponse, SignupResponse, RefreshResponse } from '@/types/auth';

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

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
  async getStatus(): Promise<{ status: string; isActive: boolean; systemRole: string; onboardingStatus?: string }> {
    const response = await axiosClient.get<{ status: string; isActive: boolean; systemRole: string; onboardingStatus?: string }>('/users/me/status');
    return response.data;
  },

  /**
   * Fetches full details for the logged-in user (including onboarding details & profile data)
   */
  async getMe(): Promise<any> {
    const response = await axiosClient.get<any>('/users/me');
    return response.data;
  },

  /**
   * Updates current user's onboarding progress step or profile data
   */
  async updateOnboarding(payload: { currentStep?: number; profileData?: any }): Promise<any> {
    const response = await axiosClient.patch<any>('/users/onboarding', payload);
    return response.data;
  },

  /**
   * Uploads a file for onboarding (e.g. photo, ID docs, tax forms)
   */
  async uploadOnboardingFile(file: File, documentType: string): Promise<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const response = await axiosClient.post<{ fileUrl: string }>('/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

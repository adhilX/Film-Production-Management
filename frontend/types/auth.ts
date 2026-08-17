export interface UserProfile {
  id: string;
  email: string;
  name: string;
  contractorType: string;
  systemRoleId?: {
    _id: string;
    name: string;
  };
  status: string;
  permissions: string[];
  onboardingStatus?: string;
  currentStep?: number;
  adminFeedback?: string;
  isActive?: boolean;
}

export interface LoginResponse {
  access_token: string;
}

export interface SignupResponse {
  message: string;
  userId: string;
  status: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  contractorType: string;
  systemRole: string;
  status: string;
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

export interface SignupResponse {
  message: string;
  userId: string;
  status: string;
}

export interface RefreshResponse {
  access_token: string;
}

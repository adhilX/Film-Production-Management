import { Types } from 'mongoose';

export interface AuthUserProfile {
  id: Types.ObjectId | string;
  email: string;
  name: string;
  contractorType: string;
  systemRoleId?: any;
  status: string;
  permissions: string[];
}

export interface SignupResponse {
  message: string;
  userId: Types.ObjectId | string;
  status: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends AuthTokens {}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

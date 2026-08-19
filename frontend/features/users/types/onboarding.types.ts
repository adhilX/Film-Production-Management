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

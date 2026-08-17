import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import type {
  SignupResponse,
  LoginResponse,
  RefreshTokenResponse,
} from './auth-response.interface';

export interface IAuthService {
  signup(signupDto: SignupDto): Promise<SignupResponse>;
  login(loginDto: LoginDto): Promise<LoginResponse>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
  logout(userId: string): Promise<void>;
}

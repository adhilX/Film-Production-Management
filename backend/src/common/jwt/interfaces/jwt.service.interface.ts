import { JwtPayload } from './jwt-payload.interface';

export interface IJwtService {
  generateAccessToken(payload: JwtPayload): Promise<string>;
  generateRefreshToken(payload: JwtPayload): Promise<string>;
  generateTokens(payload: JwtPayload): Promise<{ access_token: string; refresh_token: string }>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
}

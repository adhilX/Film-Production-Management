import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { IJwtService } from './interfaces/jwt.service.interface';
import { AUTH_MESSAGES } from '../constants/messages.constant';

@Injectable()
export class JwtService implements IJwtService {
  constructor(private readonly _nestJwtService: NestJwtService) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const accessTokenSecret =
      process.env.JWT_SECRET || 'super_secret_film_production_management_key_123!';
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const options: JwtSignOptions = { secret: accessTokenSecret, expiresIn: expiresIn as unknown as JwtSignOptions['expiresIn'] };
    return this._nestJwtService.signAsync({ ...payload }, options);
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_456!';
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const options: JwtSignOptions = { secret: refreshTokenSecret, expiresIn: expiresIn as unknown as JwtSignOptions['expiresIn'] };
    return this._nestJwtService.signAsync({ ...payload }, options);
  }

  async generateTokens(payload: JwtPayload): Promise<{ access_token: string; refresh_token: string }> {
    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);
    return { access_token, refresh_token };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const accessTokenSecret =
      process.env.JWT_SECRET || 'super_secret_film_production_management_key_123!';
    try {
      return await this._nestJwtService.verifyAsync<JwtPayload>(token, { secret: accessTokenSecret });
    } catch (err) {
      throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_EXPIRED);
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_456!';
    try {
      return await this._nestJwtService.verifyAsync<JwtPayload>(token, { secret: refreshTokenSecret });
    } catch (err) {
      throw new UnauthorizedException(AUTH_MESSAGES.TOKEN_EXPIRED);
    }
  }
}

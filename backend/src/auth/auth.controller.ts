import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './guards/auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new contractor application (Draft status)' })
  @ApiResponse({ status: 201, description: 'User successfully registered in Draft state.' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials and set HttpOnly refresh_token cookie' })
  @ApiResponse({ status: 200, description: 'Authentication successful with access_token and user profile.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, result.refresh_token);
    const { refresh_token, ...responseBody } = result;
    return responseBody;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token via HttpOnly cookie or request body' })
  @ApiResponse({ status: 200, description: 'New access_token generated and HttpOnly cookie updated.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refreshToken(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['refresh_token'] || dto.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const result = await this.authService.refreshToken(token);
    this.setRefreshTokenCookie(res, result.refresh_token);
    return { access_token: result.access_token };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out user and clear HttpOnly refresh_token cookie' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { message: 'Logged out successfully' };
  }
}

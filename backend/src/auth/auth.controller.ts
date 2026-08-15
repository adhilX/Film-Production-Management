import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new contractor application (Draft status)' })
  @ApiResponse({ status: 210, description: 'User successfully registered in Draft state.' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials and return JWT bearer token' })
  @ApiResponse({ status: 200, description: 'Authentication successful with access_token and user info.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

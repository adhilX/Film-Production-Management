import { Module, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';

@Global()
@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_film_production_management_key_123!',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtService],
  exports: [NestJwtModule, JwtService],
})
export class JwtModule {}

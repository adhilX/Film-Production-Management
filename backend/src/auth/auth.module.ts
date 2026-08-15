import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import { CastCrew, CastCrewSchema } from '../productions/schemas/cast-crew.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_film_production_management_key_123!',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [MongooseModule, JwtModule, AuthService],
})
export class AuthModule {}

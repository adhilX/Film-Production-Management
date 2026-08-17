import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import {
  CastCrew,
  CastCrewSchema,
} from '../productions/schemas/cast-crew.schema';
import { Permission, PermissionSchema } from './schemas/permission.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, PermissionsGuard],
  exports: [MongooseModule, AuthService, AuthGuard, PermissionsGuard],
})
export class AuthModule {}

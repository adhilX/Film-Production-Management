import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import {
  DocumentRecord,
  DocumentRecordSchema,
} from './schemas/document-record.schema';
import { Role, RoleSchema } from '../auth/schemas/role.schema';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { CastCrew, CastCrewSchema } from '../productions/schemas/cast-crew.schema';
import { AuditLog, AuditLogSchema } from '../audit-logs/schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
      { name: Role.name, schema: RoleSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


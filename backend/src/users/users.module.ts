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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

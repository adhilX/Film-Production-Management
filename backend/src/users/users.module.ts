import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import {
  DocumentRecord,
  DocumentRecordSchema,
} from './schemas/document-record.schema';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { ProductionsModule } from '../productions/productions.module';
import { UserOnboardingService } from './services/user-onboarding.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
    ]),
    CloudinaryModule,
    forwardRef(() => ProductionsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserOnboardingService],
  exports: [MongooseModule, UsersService, UserOnboardingService],
})
export class UsersModule {}

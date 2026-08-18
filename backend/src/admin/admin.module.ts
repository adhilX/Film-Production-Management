import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AdminRbacService } from './services/admin-rbac.service';
import { AdminOnboardingService } from './services/admin-onboarding.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    AuditLogsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRbacService, AdminOnboardingService],
  exports: [AdminService, AdminRbacService, AdminOnboardingService],
})
export class AdminModule {}

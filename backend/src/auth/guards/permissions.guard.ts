import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { GENERAL_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url = request.url || '';

    // Onboarding Gate Bypass: Allow exceptions for onboarding and profile retrieval routes
    const isOnboardingRoute =
      url.includes('/users/onboarding') ||
      url.includes('/users/upload') ||
      url.endsWith('/users/me') ||
      url.endsWith('/users/me/status');

    if (isOnboardingRoute) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    const timestamp = new Date().toISOString();

    // Onboarding Gate: If user is not Admin and onboarding is not approved, block permission-protected features
    const isAdmin = user.permissions && user.permissions.includes('roles.manage');
    if (!isAdmin && user.onboardingStatus !== 'approved') {
      await this.auditLogsService.log(
        user._id.toString(),
        'PERMISSION_DENIED_ONBOARDING_GATE',
        user._id.toString(),
        'Security',
        `Target Permissions: [${required.join(', ')}], Timestamp: ${timestamp}, Onboarding Status: ${user.onboardingStatus}`,
        'Access Denied (Onboarding Gate Enforced)',
      );
      throw new ForbiddenException(
        'Access denied: Onboarding must be approved to access this resource.',
      );
    }



    // Extract user permission strings
    const userPermissions: string[] = user.permissions || [];

    // Verify user has all the required permissions (AND logic)
    const hasAll = required.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      // Audit log the permission failure with detailed metadata
      await this.auditLogsService.log(
        user._id.toString(),
        'PERMISSION_DENIED',
        user._id.toString(),
        'Security',
        `Target Permissions: [${required.join(', ')}], User Permissions: [${userPermissions.join(', ')}], Timestamp: ${timestamp}`,
        'Access Denied',
      );
      throw new ForbiddenException(GENERAL_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}

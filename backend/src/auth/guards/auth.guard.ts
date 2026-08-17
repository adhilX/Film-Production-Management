import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { CastCrew, CastCrewDocument } from '../../productions/schemas/cast-crew.schema';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CHECK_PRODUCTION_KEY } from '../decorators/check-production.decorator';
import { JwtService } from '../../common/jwt/jwt.service';
import { GENERAL_MESSAGES, USER_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly _reflector: Reflector,
    private readonly _jwtService: JwtService,
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly _roleModel: Model<RoleDocument>,
    @InjectModel(CastCrew.name) private readonly _castCrewModel: Model<CastCrewDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];
    const payload = await this._jwtService.verifyAccessToken(token);

    const user = await this._userModel.findById(payload.userId).exec();
    if (!user) {
      throw new UnauthorizedException(USER_MESSAGES.NOT_FOUND);
    }

    // Allow inactive users to retrieve their own user profile or check their onboarding status
    const isSelfProfileRequest = request.url.includes(`/users/${user._id.toString()}`);
    const isStatusRequest = request.url.endsWith('/users/me/status');
    const isOnboardingRequest = request.url.endsWith('/users/me') || request.url.includes('/users/onboarding') || request.url.includes('/users/upload');
    const isLogoutRequest = request.url.includes('/auth/logout');

    if (!user.isActive && !isSelfProfileRequest && !isStatusRequest && !isOnboardingRequest && !isLogoutRequest) {
      throw new ForbiddenException(USER_MESSAGES.INACTIVE_ACCOUNT);
    }

    request.user = user;

    const requiredPermissions = this._reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (user.systemRole !== 'Admin') {
        const userRole = await this._roleModel.findById(user.roleId).populate('permissions').exec();
        const userPermissions = (userRole?.permissions as any[] || []).map((p) => p.name);
        const hasAllPermissions = requiredPermissions.every((perm) =>
          userPermissions.includes(perm),
        );
        if (!hasAllPermissions) {
          throw new ForbiddenException(GENERAL_MESSAGES.FORBIDDEN);
        }
      }
    }

    const checkProduction = this._reflector.getAllAndOverride<boolean>(
      CHECK_PRODUCTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (checkProduction) {
      if (user.systemRole !== 'Admin') {
        let productionId =
          request.params.productionId ||
          request.body.productionId ||
          request.query.productionId;

        if (!productionId && request.params.id && request.url.includes('/productions/')) {
          productionId = request.params.id;
        }

        if (!productionId) {
          throw new ForbiddenException('Production ID is required for resource scope check');
        }

        const isAssigned = await this._castCrewModel.findOne({
          userId: user._id,
          productionId,
        }).exec();

        if (!isAssigned) {
          throw new ForbiddenException('Access denied: You are not assigned to this production');
        }
      }
    }

    return true;
  }
}

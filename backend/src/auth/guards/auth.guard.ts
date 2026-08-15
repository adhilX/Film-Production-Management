import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { CastCrew, CastCrewDocument } from '../../productions/schemas/cast-crew.schema';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CHECK_PRODUCTION_KEY } from '../decorators/check-production.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(CastCrew.name) private castCrewModel: Model<CastCrewDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }

    // Load User and Role
    const user = await this.userModel.findById(payload.sub).populate('roleId').exec();
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive or pending onboarding approval');
    }

    // Attach user to request for use in controllers/services
    request.user = user;

    // --- LEVEL 2: RBAC (Permissions Check) ---
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (user.systemRole !== 'Admin') {
        const userRole = user.roleId as any as Role;
        const userPermissions = userRole?.permissions || [];
        const hasAllPermissions = requiredPermissions.every((perm) =>
          userPermissions.includes(perm),
        );
        if (!hasAllPermissions) {
          throw new ForbiddenException('Insufficient permissions to access this resource');
        }
      }
    }

    // --- LEVEL 3: Resource Scope Check ---
    const checkProduction = this.reflector.getAllAndOverride<boolean>(
      CHECK_PRODUCTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (checkProduction) {
      if (user.systemRole !== 'Admin') {
        let productionId =
          request.params.productionId ||
          request.body.productionId ||
          request.query.productionId;

        // If it's a route parameterized by :id, it might represent a production ID itself
        if (!productionId && request.params.id && request.url.includes('/productions/')) {
          productionId = request.params.id;
        }

        if (!productionId) {
          throw new ForbiddenException('Production ID is required for resource scope check');
        }

        const isAssigned = await this.castCrewModel.findOne({
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

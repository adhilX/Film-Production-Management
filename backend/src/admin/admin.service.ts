import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  UserProfile,
  UserProfileDocument,
} from '../users/schemas/user-profile.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import {
  Permission,
  PermissionDocument,
} from '../auth/schemas/permission.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcryptjs';
import { getTransactionSession } from '../common/utils/transaction.util';
import { AdminRbacService } from './services/admin-rbac.service';
import { getPaginationParams, calculateTotalPages } from '../common/utils/pagination.util';

import { AdminOnboardingService } from './services/admin-onboarding.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProfile.name)
    private userProfileModel: Model<UserProfileDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectConnection() private connection: Connection,
    private auditLogsService: AuditLogsService,
    private readonly adminRbacService: AdminRbacService,
    private readonly adminOnboardingService: AdminOnboardingService,
  ) {}

  async getApplications(query: {
    page?: number;
    limit?: number;
    search?: string;
    contractorType?: string;
    department?: string;
    onboardingStatus?: string;
    stale?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    return this.adminOnboardingService.getApplications(query);
  }

  async getApplicationDetails(id: string): Promise<User> {
    return this.adminOnboardingService.getApplicationDetails(id);
  }

  async evaluateApplication(
    id: string,
    adminId: string,
    payload: { status: string; systemRoleId?: string; adminFeedback?: string },
  ): Promise<User> {
    return this.adminOnboardingService.evaluateApplication(id, adminId, payload);
  }

  // --- Granular User Operations (CRUD) ---

  async createUser(adminId: string, payload: any): Promise<User> {
    if (payload.email) {
      const emailExists = await this.userModel
        .findOne({ email: payload.email.toLowerCase().trim() })
        .exec();
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    if (payload.systemRoleId) {
      if (!Types.ObjectId.isValid(payload.systemRoleId)) {
        throw new BadRequestException('Invalid role ID format');
      }
      const roleExists = await this.roleModel.findById(payload.systemRoleId).exec();
      if (!roleExists) {
        throw new BadRequestException('Role does not exist');
      }
    }

    const passwordHash = await bcrypt.hash('TempPass123!', 10);
    const user = new this.userModel({
      email: payload.email,
      name: payload.name,
      passwordHash,
      contractorType: payload.contractorType || 'None',
      status: payload.status || 'Approved',
      onboardingStatus: payload.onboardingStatus || 'approved',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    });

    if (payload.systemRoleId) {
      user.systemRoleId = new Types.ObjectId(payload.systemRoleId);
    } else {
      user.systemRoleId = null;
    }

    await user.save();

    // Create empty profile
    const profile = new this.userProfileModel({ userId: user._id });
    await profile.save();

    await this.auditLogsService.create(
      adminId,
      user._id.toString(),
      'USER_CREATED',
      { newStatus: 'Account Created Manually' },
    );

    return user;
  }

  async updateUser(
    adminId: string,
    id: string,
    payload: any,
    requesterPermissions: string[] = [],
    requesterRoleName = '',
  ): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldStatus = user.onboardingStatus;
    const oldActive = user.isActive;
    const oldRoleId = user.systemRoleId?.toString();

    // 1. Self-update protections
    if (payload.systemRoleId !== undefined && payload.systemRoleId !== oldRoleId && id === adminId) {
      throw new BadRequestException('You cannot modify your own system role');
    }
    if (payload.isActive !== undefined && payload.isActive !== oldActive && id === adminId) {
      throw new BadRequestException('You cannot modify your own active status');
    }

    // 1b. Email uniqueness check on update
    if (payload.email && payload.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const emailExists = await this.userModel
        .findOne({ email: payload.email.toLowerCase().trim() })
        .exec();
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    // Get Super Admin role details
    const superAdminRoleObj = await this.roleModel.findOne({ name: 'Super Admin' }).exec();

    // Fetch target user's current role name
    let targetUserRoleName = '';
    if (user.systemRoleId) {
      const targetUserRole = await this.roleModel.findById(user.systemRoleId).exec();
      if (targetUserRole) {
        targetUserRoleName = targetUserRole.name;
      }
    }

    // 2. Role assignment validations & privilege escalation checks
    if (payload.systemRoleId !== undefined && payload.systemRoleId !== oldRoleId) {
      // Require roles.manage permission to change roles
      if (!requesterPermissions.includes('roles.manage')) {
        throw new ForbiddenException('You do not have permission to manage user roles');
      }

      if (payload.systemRoleId) {
        if (!Types.ObjectId.isValid(payload.systemRoleId)) {
          throw new BadRequestException('Invalid role ID format');
        }
        const targetRoleObj = await this.roleModel.findById(payload.systemRoleId).exec();
        if (!targetRoleObj) {
          throw new BadRequestException('Target role does not exist');
        }

        // Only Super Admins can assign the Super Admin role
        if (targetRoleObj.name === 'Super Admin' && requesterRoleName !== 'Super Admin') {
          throw new ForbiddenException('Only Super Admins can assign the Super Admin role');
        }
      }

      // Non-Super Admins cannot modify Super Admin role
      if (targetUserRoleName === 'Super Admin' && requesterRoleName !== 'Super Admin') {
        throw new ForbiddenException('Only Super Admins can modify Super Admin accounts');
      }

      // Safeguard: Prevent leaving the system with 0 active Super Admins
      if (targetUserRoleName === 'Super Admin' && payload.systemRoleId !== superAdminRoleObj?._id.toString()) {
        const superAdminCount = await this.userModel.countDocuments({
          systemRoleId: superAdminRoleObj?._id,
          isActive: true,
        }).exec();
        if (superAdminCount <= 1) {
          throw new BadRequestException('Cannot change the role of the last active Super Admin');
        }
      }
    }

    // 3. Status change validations
    if (payload.isActive !== undefined && payload.isActive !== oldActive) {
      // Non-Super Admins cannot deactivate a Super Admin
      if (targetUserRoleName === 'Super Admin' && requesterRoleName !== 'Super Admin') {
        throw new ForbiddenException('Only Super Admins can modify Super Admin accounts');
      }

      // Safeguard: Prevent leaving the system with 0 active Super Admins
      if (targetUserRoleName === 'Super Admin' && payload.isActive === false) {
        const superAdminCount = await this.userModel.countDocuments({
          systemRoleId: superAdminRoleObj?._id,
          isActive: true,
        }).exec();
        if (superAdminCount <= 1) {
          throw new BadRequestException('Cannot deactivate the last active Super Admin');
        }
      }
    }

    // Apply updates
    if (payload.email) user.email = payload.email;
    if (payload.name) user.name = payload.name;
    if (payload.contractorType) user.contractorType = payload.contractorType;
    if (payload.status) user.status = payload.status;
    if (payload.onboardingStatus) user.onboardingStatus = payload.onboardingStatus;
    if (payload.isActive !== undefined) user.isActive = payload.isActive;

    if (payload.systemRoleId) {
      user.systemRoleId = new Types.ObjectId(payload.systemRoleId);
    } else if (payload.systemRoleId === null) {
      user.systemRoleId = null;
    }

    await user.save();

    // 4. Audit Logging
    if (payload.systemRoleId !== undefined && payload.systemRoleId !== oldRoleId) {
      await this.auditLogsService.create(
        adminId,
        user._id.toString(),
        'USER_ROLE_CHANGED',
        { oldRole: oldRoleId, newRole: payload.systemRoleId },
      );
    }

    if (payload.isActive !== undefined && payload.isActive !== oldActive) {
      await this.auditLogsService.create(
        adminId,
        user._id.toString(),
        payload.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        { oldActive, newActive: payload.isActive },
      );
    }

    // Log general update if other fields changed
    if (
      payload.email !== undefined ||
      payload.name !== undefined ||
      payload.contractorType !== undefined ||
      payload.status !== undefined ||
      payload.onboardingStatus !== undefined
    ) {
      await this.auditLogsService.create(
        adminId,
        user._id.toString(),
        'USER_UPDATED',
        { oldStatus, newStatus: user.onboardingStatus },
      );
    }

    return user;
  }

  // --- System Settings (RBAC Management) ---

  getRoles(): Promise<Role[]> {
    return this.adminRbacService.getRoles();
  }

  createRole(
    adminId: string,
    payload: { name: string; permissions: string[] },
    requesterPermissions: string[] = [],
    requesterRoleName = '',
  ): Promise<Role> {
    return this.adminRbacService.createRole(adminId, payload, requesterPermissions, requesterRoleName);
  }

  updateRole(
    adminId: string,
    roleId: string,
    payload: { permissions: string[] },
    requesterPermissions: string[] = [],
    requesterRoleName = '',
    requesterRoleId = '',
  ): Promise<Role> {
    return this.adminRbacService.updateRole(
      adminId,
      roleId,
      payload,
      requesterPermissions,
      requesterRoleName,
      requesterRoleId,
    );
  }

  // --- Global Permissions Management ---

  getPermissions(): Promise<Permission[]> {
    return this.adminRbacService.getPermissions();
  }

  createPermission(
    adminId: string,
    payload: { name: string; description?: string; group?: string },
  ): Promise<Permission> {
    return this.adminRbacService.createPermission(adminId, payload);
  }
}

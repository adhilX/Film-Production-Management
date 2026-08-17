import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  ) {}

  async getPendingApplications(): Promise<User[]> {
    return this.userModel
      .find({ onboardingStatus: 'pending-review' })
      .populate('profile')
      .select('-passwordHash')
      .exec();
  }

  async getApplicationDetails(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate('profile')
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async evaluateApplication(
    id: string,
    adminId: string,
    payload: { status: string; systemRoleId?: string; adminFeedback?: string },
  ): Promise<User> {
    let session: any = null;
    const client = this.connection.getClient() as any;
    const isStandalone = client?.topology?.description?.type === 'Single';
    
    if (!isStandalone) {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
    }
    
    try {
      const user = session 
        ? await this.userModel.findById(id).session(session).exec()
        : await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const { status, systemRoleId, adminFeedback } = payload;
      const oldStatus = user.onboardingStatus;

      if (status === 'approved') {
        user.isActive = true;
        user.onboardingStatus = 'approved';
        user.status = 'Approved';
        user.adminFeedback = '';

        if (!systemRoleId) {
          throw new BadRequestException('systemRoleId is required for Approval');
        }

        // Verify that the Role actually exists
        const roleExists = session
          ? await this.roleModel.findById(systemRoleId).session(session).exec()
          : await this.roleModel.findById(systemRoleId).exec();

        if (!roleExists) {
          throw new BadRequestException('Invalid systemRoleId: Role does not exist in the database');
        }

        user.systemRoleId = new Types.ObjectId(systemRoleId);
      } else if (status === 'changes-requested') {
        user.isActive = false;
        user.onboardingStatus = 'changes-requested';
        user.status = 'Changes Requested';
        // Note: We deliberately do NOT change systemRoleId on rejection
        user.adminFeedback =
          adminFeedback || 'Please review and update your onboarding details.';
      } else {
        throw new BadRequestException('Invalid evaluation status');
      }

      if (session) {
        await user.save({ session });
        await this.auditLogsService.create(
          adminId,
          user._id.toString(),
          status === 'approved'
            ? 'USER_ONBOARDING_APPROVED'
            : 'USER_ONBOARDING_CHANGES_REQUESTED',
          {
            oldStatus,
            newStatus: user.onboardingStatus,
            assignedRole: systemRoleId || null,
          },
          undefined,
          undefined,
          session,
        );
        await session.commitTransaction();
      } else {
        await user.save();
        await this.auditLogsService.create(
          adminId,
          user._id.toString(),
          status === 'approved'
            ? 'USER_ONBOARDING_APPROVED'
            : 'USER_ONBOARDING_CHANGES_REQUESTED',
          {
            oldStatus,
            newStatus: user.onboardingStatus,
            assignedRole: systemRoleId || null,
          },
          undefined,
          undefined,
          undefined,
        );
      }
      return user;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  // --- Granular User Operations (CRUD) ---

  async createUser(adminId: string, payload: any): Promise<User> {
    const passwordHash = await bcrypt.hash('TempPass123!', 10);
    const user = new this.userModel({
      ...payload,
      passwordHash,
      status: payload.status || 'Approved',
      onboardingStatus: payload.onboardingStatus || 'approved',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    });

    if (payload.systemRoleId) {
      user.systemRoleId = new Types.ObjectId(payload.systemRoleId);
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

  async updateUser(adminId: string, id: string, payload: any): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldStatus = user.onboardingStatus;

    if (payload.email) user.email = payload.email;
    if (payload.name) user.name = payload.name;
    if (payload.contractorType) user.contractorType = payload.contractorType;

    if (payload.status) user.status = payload.status;
    if (payload.onboardingStatus)
      user.onboardingStatus = payload.onboardingStatus;
    if (payload.isActive !== undefined) user.isActive = payload.isActive;

    if (payload.systemRoleId) {
      user.systemRoleId = new Types.ObjectId(payload.systemRoleId);
    } else if (payload.systemRoleId === null) {
      user.systemRoleId = null;
    }

    await user.save();

    await this.auditLogsService.create(
      adminId,
      user._id.toString(),
      'USER_UPDATED',
      { oldStatus, newStatus: user.onboardingStatus },
    );

    return user;
  }

  // --- System Settings (RBAC Management) ---

  async getRoles(): Promise<Role[]> {
    return this.roleModel.find().populate('permissions').exec();
  }

  async createRole(
    adminId: string,
    payload: { name: string; permissions: string[] },
  ): Promise<Role> {
    const role = new this.roleModel({
      name: payload.name,
      permissions: payload.permissions.map((id) => new Types.ObjectId(id)),
    });
    await role.save();

    await this.auditLogsService.create(
      adminId,
      role._id.toString(),
      'ROLE_CREATED',
      { newStatus: `Created Role: ${role.name}` },
    );

    return role.populate('permissions');
  }

  async updateRole(
    adminId: string,
    roleId: string,
    payload: { permissions: string[] },
  ): Promise<Role> {
    const role = await this.roleModel.findById(roleId).exec();
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = payload.permissions.map((id) => new Types.ObjectId(id));
    await role.save();

    await this.auditLogsService.create(
      adminId,
      role._id.toString(),
      'ROLE_UPDATED',
      { newStatus: `Updated permissions for Role: ${role.name}` },
    );

    return role.populate('permissions');
  }

  // --- Global Permissions Management ---

  async getPermissions(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async createPermission(
    adminId: string,
    payload: { name: string; description?: string; group?: string },
  ): Promise<Permission> {
    const existing = await this.permissionModel
      .findOne({ name: payload.name.trim() })
      .exec();
    if (existing) {
      throw new BadRequestException('Permission already exists');
    }

    const permission = new this.permissionModel({
      name: payload.name.trim(),
      description: payload.description,
      group: payload.group || 'Custom Perms',
    });
    await permission.save();

    await this.auditLogsService.create(
      adminId,
      permission._id.toString(),
      'PERMISSION_CREATED',
      { newStatus: `Created Global Permission: ${permission.name}` },
    );

    return permission;
  }
}

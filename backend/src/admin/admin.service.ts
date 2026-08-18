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
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Default status filter to 'pending-review' if not specified or not 'all'
    const onboardingStatus = query.onboardingStatus || 'pending-review';
    if (onboardingStatus !== 'all') {
      filter.onboardingStatus = onboardingStatus;
    }

    if (query.contractorType && query.contractorType !== 'all') {
      filter.contractorType = query.contractorType;
    }

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (query.stale) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filter.updatedAt = { $lt: threeDaysAgo };
      filter.onboardingStatus = 'pending-review'; // Stale only applies to pending-review
    }

    if (query.department && query.department !== 'all') {
      const escapedDept = query.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const profiles = await this.userProfileModel
        .find({ department: { $regex: escapedDept, $options: 'i' } })
        .select('userId')
        .exec();
      const userIds = profiles.map(p => p.userId);
      filter._id = { $in: userIds };
    }

    // Determine sort order
    let sort: any = { updatedAt: -1 };
    if (query.sortBy) {
      const order = query.sortOrder === 'asc' ? 1 : -1;
      if (query.sortBy === 'name') {
        sort = { name: order };
      } else if (query.sortBy === 'contractorType') {
        sort = { contractorType: order };
      } else if (query.sortBy === 'status') {
        sort = { status: order };
      } else if (query.sortBy === 'submittedDate' || query.sortBy === 'updatedAt') {
        sort = { updatedAt: order };
      }
    }

    // Execute query
    const total = await this.userModel.countDocuments(filter).exec();
    const pages = Math.ceil(total / limit);

    const applications = await this.userModel
      .find(filter)
      .populate('profile')
      .select('-passwordHash')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Calculate database counts for metrics
    const pendingMetrics = await this.userModel.countDocuments({ onboardingStatus: 'pending-review' }).exec();
    const approvedMetrics = await this.userModel.countDocuments({ onboardingStatus: 'approved' }).exec();
    const changesRequestedMetrics = await this.userModel.countDocuments({ onboardingStatus: 'changes-requested' }).exec();
    const rejectedMetrics = await this.userModel.countDocuments({ status: 'Rejected' }).exec();
    const totalMetrics = await this.userModel.countDocuments().exec();

    return {
      applications,
      total,
      page,
      pages,
      limit,
      metrics: {
        pending: pendingMetrics,
        approved: approvedMetrics,
        rejected: rejectedMetrics,
        changesRequested: changesRequestedMetrics,
        total: totalMetrics,
      },
    };
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

      if (oldStatus !== 'pending-review') {
        throw new BadRequestException(`Cannot evaluate user with onboarding status: ${oldStatus}`);
      }

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
        if (!adminFeedback || !adminFeedback.trim()) {
          throw new BadRequestException('adminFeedback is required when status is changes-requested');
        }
        user.isActive = false;
        user.onboardingStatus = 'changes-requested';
        user.status = 'Changes Requested';
        user.adminFeedback = adminFeedback;
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

  async getRoles(): Promise<Role[]> {
    return this.roleModel.find().populate('permissions').exec();
  }

  async createRole(
    adminId: string,
    payload: { name: string; permissions: string[] },
    requesterPermissions: string[] = [],
    requesterRoleName = '',
  ): Promise<Role> {
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Role name cannot be empty');
    }

    // Enforce case-insensitive uniqueness
    const existingRole = await this.roleModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    }).exec();
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Protect core system roles name
    const CORE_ROLES = ['Super Admin', 'Production Admin', 'Production Manager', 'Cast', 'Crew'];
    const isCoreRoleName = CORE_ROLES.some(
      (roleName) => roleName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isCoreRoleName) {
      throw new ConflictException('Cannot create a custom role with a core system role name');
    }

    const uniquePermIds = Array.from(new Set(payload.permissions));
    const matchedPermissions = await this.permissionModel.find({
      _id: { $in: uniquePermIds.map((id) => new Types.ObjectId(id)) }
    }).exec();

    if (matchedPermissions.length !== uniquePermIds.length) {
      throw new BadRequestException('One or more permissions do not exist in the system');
    }

    // Privilege escalation check
    if (requesterRoleName !== 'Super Admin') {
      const matchedPermNames = matchedPermissions.map(p => p.name);
      const hasUnauthorizedPerms = matchedPermNames.some(
        (permName) => !requesterPermissions.includes(permName)
      );
      if (hasUnauthorizedPerms) {
        throw new ForbiddenException('You cannot assign permissions you do not possess');
      }
    }

    const role = new this.roleModel({
      name: trimmedName,
      permissions: uniquePermIds.map((id) => new Types.ObjectId(id)),
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
    requesterPermissions: string[] = [],
    requesterRoleName = '',
    requesterRoleId = '',
  ): Promise<Role> {
    const role = await this.roleModel.findById(roleId).populate('permissions').exec();
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Super Admin protection: lockout prevention
    if (role.name === 'Super Admin') {
      throw new ForbiddenException('The Super Admin role is protected and cannot be modified');
    }

    // Core role protection
    const CORE_ROLES = ['Super Admin', 'Production Admin', 'Production Manager', 'Cast', 'Crew'];
    const isTargetCoreRole = CORE_ROLES.includes(role.name);
    if (isTargetCoreRole && requesterRoleName !== 'Super Admin') {
      throw new ForbiddenException(`You do not have permission to modify the core system role: ${role.name}`);
    }

    const uniquePermIds = Array.from(new Set(payload.permissions));
    const matchedPermissions = await this.permissionModel.find({
      _id: { $in: uniquePermIds.map((id) => new Types.ObjectId(id)) }
    }).exec();

    if (matchedPermissions.length !== uniquePermIds.length) {
      throw new BadRequestException('One or more permissions do not exist in the system');
    }

    const matchedPermNames = matchedPermissions.map(p => p.name);

    // Self-privilege escalation check & privilege escalation check
    if (requesterRoleName !== 'Super Admin') {
      if (roleId === requesterRoleId) {
        const currentPermNames = (role.permissions as any[]).map((p: any) => p.name || p.toString());
        const hasNewPerms = matchedPermNames.some(name => !currentPermNames.includes(name));
        if (hasNewPerms) {
          throw new ForbiddenException('You cannot escalate your own role permissions');
        }
      }

      const hasUnauthorizedPerms = matchedPermNames.some(
        (permName) => !requesterPermissions.includes(permName)
      );
      if (hasUnauthorizedPerms) {
        throw new ForbiddenException('You cannot assign permissions you do not possess');
      }
    }

    // Preserve previous permissions for auditing
    const previousPerms = (role.permissions as any[]).map(p => p._id.toString());
    const previousPermNames = (role.permissions as any[]).map(p => p.name);

    role.permissions = uniquePermIds.map((id) => new Types.ObjectId(id));
    await role.save();

    await this.auditLogsService.create(
      adminId,
      role._id.toString(),
      'ROLE_UPDATED',
      {
        roleId: role._id.toString(),
        roleName: role.name,
        previousPermissions: previousPerms,
        newPermissions: uniquePermIds,
        previousPermissionNames: previousPermNames,
        newPermissionNames: matchedPermNames,
        newStatus: `Updated permissions for Role: ${role.name}`,
      },
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
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Permission name cannot be empty');
    }

    const existing = await this.permissionModel
      .findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } })
      .exec();
    if (existing) {
      throw new ConflictException('Permission already exists');
    }

    const permission = new this.permissionModel({
      name: trimmedName,
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

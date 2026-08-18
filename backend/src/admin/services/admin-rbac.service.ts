import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../../auth/schemas/role.schema';
import {
  Permission,
  PermissionDocument,
} from '../../auth/schemas/permission.schema';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

@Injectable()
export class AdminRbacService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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

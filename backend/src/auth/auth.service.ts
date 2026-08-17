import { Injectable, OnModuleInit, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '../common/jwt/jwt.service';
import type { SignupResponse, LoginResponse, RefreshTokenResponse } from './interfaces/auth-response.interface';
import type { IAuthService } from './interfaces/auth.service.interface';
import { AUTH_MESSAGES, USER_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class AuthService implements IAuthService, OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly _roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name) private readonly _permissionModel: Model<PermissionDocument>,
    private readonly _jwtService: JwtService,
  ) { }

  async onModuleInit() {
    await this.seedRolesAndAdmin();
  }

  private async seedRolesAndAdmin() {
    // 0. Seed Permissions
    const defaultPermissions = [
      // User & Auth Perms
      { name: 'users.view', description: 'View Users', group: 'User & Auth Perms' },
      { name: 'users.create', description: 'Create Users', group: 'User & Auth Perms' },
      { name: 'users.update', description: 'Update Users', group: 'User & Auth Perms' },
      { name: 'users.approve', description: 'Approve Onboarding', group: 'User & Auth Perms' },
      { name: 'roles.view', description: 'View Roles', group: 'User & Auth Perms' },
      { name: 'roles.manage', description: 'Manage Roles & RBAC', group: 'User & Auth Perms' },
      { name: 'audit_logs.view', description: 'View Audit Logs', group: 'User & Auth Perms' },
      // Production Perms
      { name: 'productions.view', description: 'View Productions', group: 'Production Perms' },
      { name: 'productions.create', description: 'Create Productions', group: 'Production Perms' },
      { name: 'productions.update', description: 'Edit Productions', group: 'Production Perms' },
      { name: 'locations.view', description: 'View Locations', group: 'Production Perms' },
      { name: 'locations.book', description: 'Book Locations', group: 'Production Perms' },
      { name: 'locations.approve', description: 'Approve Locations', group: 'Production Perms' },
      { name: 'inventory.view', description: 'View Inventory', group: 'Production Perms' },
      { name: 'inventory.manage', description: 'Manage Inventory', group: 'Production Perms' },
      // Financial Perms
      { name: 'funds.view', description: 'View Fund Requests', group: 'Financial Perms' },
      { name: 'funds.create', description: 'Submit Fund Requests', group: 'Financial Perms' },
      { name: 'funds.approve', description: 'Approve Fund Requests', group: 'Financial Perms' },
    ];

    for (const perm of defaultPermissions) {
      const existing = await this._permissionModel.findOne({ name: perm.name }).exec();
      if (!existing) {
        await new this._permissionModel(perm).save();
      }
    }

    // 1. Seed Roles
    const adminPermissions = [
      'users.approve',
      'locations.approve',
      'locations.book',
      'funds.approve',
      'audit_logs.view',
      'production.delete',
      'productions.create',
    ];

    const managerPermissions = [
      'locations.approve',
      'locations.book',
      'funds.approve',
      'productions.create',
    ];

    const userPermissions = ['locations.book'];

    const getPermissionIds = async (names: string[]): Promise<any[]> => {
      const perms = await this._permissionModel.find({ name: { $in: names } }).exec();
      return perms.map(p => p._id);
    };

    const adminPermissionIds = await getPermissionIds(adminPermissions);
    const managerPermissionIds = await getPermissionIds(managerPermissions);
    const userPermissionIds = await getPermissionIds(userPermissions);

    let adminRole = await this._roleModel.findOne({ name: 'Admin' }).exec();
    if (!adminRole) {
      adminRole = new this._roleModel({ name: 'Admin', permissions: adminPermissionIds });
      await adminRole.save();
    } else {
      adminRole.permissions = adminPermissionIds as any;
      await adminRole.save();
    }

    let managerRole = await this._roleModel.findOne({ name: 'Production Manager' }).exec();
    if (!managerRole) {
      managerRole = new this._roleModel({ name: 'Production Manager', permissions: managerPermissionIds });
      await managerRole.save();
    } else {
      managerRole.permissions = managerPermissionIds as any;
      await managerRole.save();
    }

    let userRole = await this._roleModel.findOne({ name: 'User' }).exec();
    if (!userRole) {
      userRole = new this._roleModel({ name: 'User', permissions: userPermissionIds });
      await userRole.save();
    } else {
      userRole.permissions = userPermissionIds as any;
      await userRole.save();
    }

    // 2. Seed Default Admin
    const adminEmail = 'admin@production.com';
    const existingAdmin = await this._userModel.findOne({ email: adminEmail }).exec();
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
      const admin = new this._userModel({
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        contractorType: 'Production Company',
        systemRole: 'Admin',
        status: 'Approved',
        roleId: adminRole._id,
        isActive: true,
        onboardingStatus: 'approved',
        currentStep: 6,
      });
      await admin.save();
      console.log('Seeded default admin user: admin@production.com / AdminPassword123!');
    }
  }

  async signup(signupDto: SignupDto): Promise<SignupResponse> {
    const { email, password, name, contractorType } = signupDto;
    const existingUser = await this._userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException(USER_MESSAGES.ALREADY_EXISTS);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = await this._roleModel.findOne({ name: 'User' }).exec();

    const user = new this._userModel({
      email,
      passwordHash,
      name,
      contractorType,
      systemRole: 'User',
      status: 'Pending',
      roleId: userRole?._id,
      isActive: false,
    });

    await user.save();
    return {
      message: AUTH_MESSAGES.SIGNUP_SUCCESSFUL,
      userId: user._id,
      status: user.status,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this._userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokens = await this._jwtService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.systemRole,
    });

    return {
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const payload = await this._jwtService.verifyRefreshToken(refreshToken);

    const user = await this._userModel.findById(payload.userId).exec();
    if (!user) {
      throw new UnauthorizedException(USER_MESSAGES.NOT_FOUND);
    }

    return this._jwtService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.systemRole,
    });
  }

  async logout(userId: string): Promise<void> {
    return;
  }
}

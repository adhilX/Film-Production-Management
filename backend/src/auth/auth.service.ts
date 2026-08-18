import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '../common/jwt/jwt.service';
import type {
  SignupResponse,
  LoginResponse,
  RefreshTokenResponse,
} from './interfaces/auth-response.interface';
import type { IAuthService } from './interfaces/auth.service.interface';
import {
  AUTH_MESSAGES,
  USER_MESSAGES,
} from '../common/constants/messages.constant';
import { defaultPermissions, rolesConfig } from './constants/seed-data.constant';

@Injectable()
export class AuthService implements IAuthService, OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly _roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private readonly _permissionModel: Model<PermissionDocument>,
    private readonly _jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedRolesAndAdmin();
  }

  private async seedRolesAndAdmin() {
    // 0. Seed Permissions
    for (const perm of defaultPermissions) {
      const existing = await this._permissionModel
        .findOne({ name: perm.name })
        .exec();
      if (!existing) {
        await new this._permissionModel(perm).save();
      }
    }

    // Clean up obsolete permissions
    await this._permissionModel.deleteMany({
      name: { $nin: defaultPermissions.map(p => p.name) }
    }).exec();

    // 1. Seed Roles
    const getPermissionIds = async (names: string[]): Promise<any[]> => {
      const perms = await this._permissionModel
        .find({ name: { $in: names } })
        .exec();
      return perms.map((p) => p._id);
    };

    let superAdminRole: any = null;

    for (const r of rolesConfig) {
      const permissionIds = await getPermissionIds(r.permissions);
      let existingRole = await this._roleModel.findOne({ name: r.name }).exec();
      if (!existingRole) {
        existingRole = new this._roleModel({
          name: r.name,
          permissions: permissionIds,
        });
      } else {
        existingRole.permissions = permissionIds as any;
      }
      await existingRole.save();

      if (r.name === 'Super Admin') {
        superAdminRole = existingRole;
      }
    }

    // Clean up obsolete roles
    await this._roleModel.deleteMany({
      name: { $nin: rolesConfig.map(r => r.name) }
    }).exec();

    // 2. Seed Default Admin
    const adminEmail = 'admin@production.com';
    const existingAdmin = await this._userModel
      .findOne({ email: adminEmail })
      .exec();
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
      const admin = new this._userModel({
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        contractorType: 'Production Company',
        status: 'Approved',
        systemRoleId: superAdminRole._id,
        isActive: true,
        onboardingStatus: 'approved',
        currentStep: 6,
      });
      await admin.save();
      console.log(
        'Seeded default admin user: admin@production.com / AdminPassword123!',
      );
    } else {
      existingAdmin.systemRoleId = superAdminRole._id;
      await existingAdmin.save();
    }
  }

  async signup(signupDto: SignupDto): Promise<SignupResponse> {
    const { email, password, name, contractorType } = signupDto;
    const existingUser = await this._userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException(USER_MESSAGES.ALREADY_EXISTS);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new this._userModel({
      email,
      passwordHash,
      name,
      contractorType,
      status: 'Pending',
      systemRoleId: null,
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
      systemRoleId: user.systemRoleId?.toString(),
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
      systemRoleId: user.systemRoleId?.toString(),
    });
  }

  async logout(userId: string): Promise<void> {
    return;
  }
}

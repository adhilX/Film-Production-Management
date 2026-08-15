import { Injectable, OnModuleInit, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedRolesAndAdmin();
  }

  private async seedRolesAndAdmin() {
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

    let adminRole = await this.roleModel.findOne({ name: 'Admin' }).exec();
    if (!adminRole) {
      adminRole = new this.roleModel({ name: 'Admin', permissions: adminPermissions });
      await adminRole.save();
    } else {
      adminRole.permissions = adminPermissions;
      await adminRole.save();
    }

    let managerRole = await this.roleModel.findOne({ name: 'Production Manager' }).exec();
    if (!managerRole) {
      managerRole = new this.roleModel({ name: 'Production Manager', permissions: managerPermissions });
      await managerRole.save();
    } else {
      managerRole.permissions = managerPermissions;
      await managerRole.save();
    }

    let userRole = await this.roleModel.findOne({ name: 'User' }).exec();
    if (!userRole) {
      userRole = new this.roleModel({ name: 'User', permissions: userPermissions });
      await userRole.save();
    } else {
      userRole.permissions = userPermissions;
      await userRole.save();
    }

    // 2. Seed Default Admin
    const adminEmail = 'admin@production.com';
    const existingAdmin = await this.userModel.findOne({ email: adminEmail }).exec();
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
      const admin = new this.userModel({
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        contractorType: 'TCS Team',
        systemRole: 'Admin',
        status: 'Approved',
        roleId: adminRole._id,
        isActive: true,
      });
      await admin.save();
      console.log('Seeded default admin user: admin@production.com / AdminPassword123!');
    }
  }

  async signup(signupDto: SignupDto): Promise<any> {
    const { email, password, name, contractorType } = signupDto;
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Default system role is User, and status is Pending onboarding approval
    const userRole = await this.roleModel.findOne({ name: 'User' }).exec();

    const user = new this.userModel({
      email,
      passwordHash,
      name,
      contractorType,
      systemRole: 'User',
      status: 'Pending',
      roleId: userRole?._id,
      isActive: false, // Inactive until onboarding approval
    });

    await user.save();
    return {
      message: 'Signup successful. Onboarding pending review.',
      userId: user._id,
      status: user.status,
    };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive. Pending onboarding approval.');
    }

    const populatedUser = await this.userModel.findById(user._id).populate('roleId').exec();
    const userRole = populatedUser?.roleId as any as Role;
    const permissions = userRole?.permissions || [];

    const payload = { email: user.email, sub: user._id, role: user.systemRole };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        contractorType: user.contractorType,
        systemRole: user.systemRole,
        status: user.status,
        permissions,
      },
    };
  }
}

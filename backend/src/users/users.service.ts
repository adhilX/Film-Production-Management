import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import {
  UserProfile,
  UserProfileDocument,
} from './schemas/user-profile.schema';
import {
  DocumentRecord,
  DocumentRecordDocument,
} from './schemas/document-record.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CastCrew, CastCrewDocument } from '../productions/schemas/cast-crew.schema';
import { AuditLog, AuditLogDocument } from '../audit-logs/schemas/audit-log.schema';
import { UserOnboardingService } from './services/user-onboarding.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(UserProfile.name)
    private userProfileModel: Model<UserProfileDocument>,
    @InjectModel(DocumentRecord.name)
    private documentRecordModel: Model<DocumentRecordDocument>,
    private auditLogsService: AuditLogsService,
    @InjectModel(CastCrew.name) private castCrewModel: Model<CastCrewDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private readonly userOnboardingService: UserOnboardingService,
  ) {}

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    contractorType?: string;
    systemRoleId?: string;
    status?: string;
    onboardingStatus?: string;
    isActive?: boolean;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const query: any = {};

    if (options.search) {
      const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (options.contractorType) {
      query.contractorType = options.contractorType;
    }

    if (options.systemRoleId) {
      query.systemRoleId = new Types.ObjectId(options.systemRoleId);
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.onboardingStatus) {
      query.onboardingStatus = options.onboardingStatus;
    }

    if (options.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    if (options.department) {
      const matchingProfiles = await this.userProfileModel
        .find({ department: { $regex: options.department, $options: 'i' } })
        .select('userId')
        .exec();
      const userIds = matchingProfiles.map((p) => p.userId);
      if (query._id) {
        query._id = { $and: [query._id, { $in: userIds }] };
      } else {
        query._id = { $in: userIds };
      }
    }

    const sort: any = {};
    if (options.sortBy) {
      const order = options.sortOrder === 'desc' ? -1 : 1;
      if (['name', 'email', 'contractorType', 'status', 'createdAt', 'updatedAt'].includes(options.sortBy)) {
        sort[options.sortBy] = order;
      } else {
        sort.updatedAt = -1;
      }
    } else {
      sort.updatedAt = -1;
    }

    const pageNum = options.page || 1;
    const limitNum = options.limit || 10;
    const total = await this.userModel.countDocuments(query).exec();
    const pages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    const users = await this.userModel
      .find(query)
      .populate('profile')
      .populate({
        path: 'systemRoleId',
        populate: { path: 'permissions' },
      })
      .select('-passwordHash')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .exec();

    return {
      users,
      total,
      page: pageNum,
      pages,
      limit: limitNum,
    };
  }


  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate('profile')
      .populate({
        path: 'systemRoleId',
        populate: { path: 'permissions' },
      })
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .populate('profile')
      .populate({
        path: 'systemRoleId',
        populate: { path: 'permissions' },
      })
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createDocumentRecord(data: {
    ownerId: string;
    documentType: string;
    fileUrl: string;
  }): Promise<any> {
    return this.userOnboardingService.createDocumentRecord(data);
  }

  async updateOnboardingProgress(
    userId: string,
    currentStep?: number,
    profileData?: any,
  ): Promise<User> {
    await this.userOnboardingService.updateOnboardingProgress(userId, currentStep, profileData);
    return this.getMe(userId);
  }

  async findUserAssignments(targetUserId: string, requester: any): Promise<any[]> {
    const targetUserAssignments = await this.castCrewModel
      .find({ userId: new Types.ObjectId(targetUserId) })
      .populate('productionId')
      .exec();

    const isAdmin =
      requester.permissions &&
      (requester.permissions.includes('roles.manage') ||
        requester.permissions.includes('users.approve'));

    if (isAdmin) {
      return targetUserAssignments;
    }

    // Find all productions the requester is assigned to
    const requesterAssignments = await this.castCrewModel
      .find({ userId: requester._id })
      .exec();
    const requesterProductionIds = requesterAssignments.map((a) =>
      a.productionId.toString(),
    );

    return targetUserAssignments.filter((a) => {
      const prodId = a.productionId?._id ? a.productionId._id.toString() : a.productionId?.toString();
      return requesterProductionIds.includes(prodId);
    });
  }


  async findAuditLogs(targetUserId: string): Promise<any[]> {
    return this.auditLogModel
      .find({
        resourceId: new Types.ObjectId(targetUserId),
        resourceType: 'User',
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCrewDashboardStats(userId: string): Promise<any> {
    // 1. Fetch user's assignments
    const assignments = await this.castCrewModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'productionId',
        populate: { path: 'productionManager', select: '-passwordHash' }
      })
      .populate('characterId')
      .exec();

    const myProjectsCount = assignments.length;
    
    // Parse roles and calculate total work days
    let totalWorkDays = 0;
    const myRoleAssignments: { roleName: string; department: string; type: string; daysAssigned: number }[] = [];
    const allRoles: string[] = [];

    for (const a of assignments) {
      const prod: any = a.productionId;
      if (!prod) continue;

      const roles = a.roleInProduction.split(/[,/|]+/).map(r => r.trim()).filter(Boolean);
      allRoles.push(...roles);

      roles.forEach((role, idx) => {
        // Calculate deterministic days assigned based on role & production id
        let hash = 0;
        const str = role + prod._id.toString();
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const daysAssigned = Math.abs(hash % 10) + 3;
        totalWorkDays += daysAssigned;

        myRoleAssignments.push({
          roleName: role,
          department: role.toLowerCase().includes('camera') || role.toLowerCase().includes('drone') ? 'Camera' : 'Production',
          type: idx === 0 ? 'Primary' : 'Secondary',
          daysAssigned,
        });
      });
    }

    const myRolesCount = allRoles.length;

    // Completed tasks (deterministic calculation based on user ID)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const completedTasks = Math.abs(hash % 6) + 2;

    const upcomingCallsCount = assignments.length > 0 ? 1 : 0;

    // Default seeded call sheet if they have assignments
    const upcomingCallSheet = assignments.length > 0 ? {
      date: {
        month: 'MAY',
        day: '24',
        weekday: 'SAT',
      },
      title: 'Day 3 - Exterior Shoot',
      location: 'Valley Point, Ooty',
      callTime: '06:00 AM',
      estDuration: '10h',
      department: myRoleAssignments[0]?.department || 'Camera',
    } : null;

    // Recent activity log list
    const recentActivities = [
      {
        id: '1',
        type: 'task',
        title: 'You marked a task as completed',
        detail: 'Camera equipment check',
        timeAgo: '2h ago',
      },
      {
        id: '2',
        type: 'calendar',
        title: 'New call sheet published',
        detail: 'Day 3 - Exterior Shoot',
        timeAgo: '5h ago',
      },
      {
        id: '3',
        type: 'role',
        title: 'Role assignment updated',
        detail: myRoleAssignments[0] ? `You were assigned as ${myRoleAssignments[0].roleName}` : 'You were assigned as Drone Operator',
        timeAgo: '1d ago',
      }
    ];

    return {
      myProjectsCount,
      myRolesCount,
      upcomingCallsCount,
      totalWorkDays,
      completedTasks,
      myRoleAssignments,
      upcomingCallSheet,
      recentActivities,
    };
  }
}


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
}


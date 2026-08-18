import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  UserProfile,
  UserProfileDocument,
} from '../../users/schemas/user-profile.schema';
import { Role, RoleDocument } from '../../auth/schemas/role.schema';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { getTransactionSession } from '../../common/utils/transaction.util';
import { getPaginationParams, calculateTotalPages } from '../../common/utils/pagination.util';

@Injectable()
export class AdminOnboardingService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProfile.name)
    private userProfileModel: Model<UserProfileDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
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
    const { page, limit, skip } = getPaginationParams(query.page, query.limit);

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

    // Execute queries in parallel
    const [
      total,
      applications,
      pendingMetrics,
      approvedMetrics,
      changesRequestedMetrics,
      rejectedMetrics,
      totalMetrics,
    ] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel
        .find(filter)
        .populate('profile')
        .select('-passwordHash')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments({ onboardingStatus: 'pending-review' }).exec(),
      this.userModel.countDocuments({ onboardingStatus: 'approved' }).exec(),
      this.userModel.countDocuments({ onboardingStatus: 'changes-requested' }).exec(),
      this.userModel.countDocuments({ status: 'Rejected' }).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    const pages = calculateTotalPages(total, limit);

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
    const session = await getTransactionSession(this.connection);
    
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
}

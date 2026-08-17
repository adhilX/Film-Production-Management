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
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

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
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    search = '',
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const query: any = { systemRole: { $ne: 'Admin' } };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const total = await this.userModel.countDocuments(query).exec();
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const users = await this.userModel
      .find(query)
      .populate({
        path: 'roleId',
        populate: { path: 'permissions' },
      })
      .select('-passwordHash')
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      users,
      total,
      page,
      pages,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'roleId',
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
        path: 'roleId',
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
    const record = new this.documentRecordModel({
      ownerId: new Types.ObjectId(data.ownerId),
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      status: 'pending',
    });
    return record.save();
  }

  async updateOnboardingProgress(
    userId: string,
    currentStep?: number,
    profileData?: any,
  ): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentStep !== undefined) {
      user.currentStep = currentStep;
      if (currentStep === 6) {
        const oldStatus = user.onboardingStatus;
        user.onboardingStatus = 'pending-review';
        user.status = 'Pending';
        user.adminFeedback = ''; // Clear out the admin feedback upon resubmission
        if (oldStatus !== 'pending-review') {
          await this.auditLogsService.create(
            userId,
            userId,
            'USER_ONBOARDING_STATUS_CHANGE',
            {
              oldStatus,
              newStatus: 'pending-review',
            },
          );
        }
      }
    }

    if (profileData) {
      let profile = await this.userProfileModel
        .findOne({ userId: user._id })
        .exec();
      if (!profile) {
        profile = new this.userProfileModel({ userId: user._id });
      }

      if (profileData.name) {
        user.name = profileData.name;
      }
      if (profileData.contractorType !== undefined) {
        user.contractorType = profileData.contractorType;
      }
      if (profileData.photoUrl !== undefined) {
        profile.photoUrl = profileData.photoUrl;
      }
      if (profileData.department !== undefined) {
        profile.department = profileData.department;
      }
      if (profileData.position !== undefined) {
        profile.position = profileData.position;
      }
      if (profileData.experience !== undefined) {
        profile.experience = Array.isArray(profileData.experience)
          ? profileData.experience
          : [profileData.experience];
      }
      if (profileData.phoneNumber !== undefined) {
        profile.phoneNumber = profileData.phoneNumber;
      }
      if (profileData.secondaryEmail !== undefined) {
        profile.secondaryEmail = profileData.secondaryEmail;
      }

      // Financials
      if (profileData.bankDetails !== undefined) {
        profile.bankDetails = {
          bankName: profileData.bankDetails.bankName || '',
          accountNumber: profileData.bankDetails.accountNumber || '',
          routingNumber: profileData.bankDetails.routingNumber || '',
        };
      }
      if (profileData.taxFormUrl !== undefined) {
        profile.taxFormUrl = profileData.taxFormUrl;
      }

      // Identity
      if (profileData.governmentIdType !== undefined) {
        profile.governmentIdType = profileData.governmentIdType;
      }
      if (profileData.identityDocs !== undefined) {
        profile.identityDocs = Array.isArray(profileData.identityDocs)
          ? profileData.identityDocs
          : [profileData.identityDocs];
      }

      // Contracts
      if (profileData.agreeNda !== undefined) {
        profile.signedNda = profileData.agreeNda;
      }
      if (profileData.agreeTerms !== undefined) {
        profile.signedTerms = profileData.agreeTerms;
      }
      if (profileData.signatureData !== undefined) {
        profile.signatureData = profileData.signatureData;
      }

      await profile.save();
    }

    await user.save();
    return this.getMe(userId);
  }

  async updateOnboarding(
    id: string,
    updateDto: UpdateOnboardingDto,
    actorId: string,
  ): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentStatus = user.status;
    const nextStatus = updateDto.status;

    // Validate 5-state state machine transitions
    const allowedTransitions: Record<string, string[]> = {
      Draft: ['Pending'],
      Pending: ['UnderReview', 'Approved', 'Rejected', 'Changes Requested'],
      UnderReview: ['Approved', 'Rejected', 'Changes Requested'],
      Approved: ['UnderReview', 'Rejected'],
      Rejected: ['UnderReview', 'Pending'],
      'Changes Requested': ['Pending', 'UnderReview'],
    };

    if (
      currentStatus !== nextStatus &&
      !allowedTransitions[currentStatus]?.includes(nextStatus)
    ) {
      throw new BadRequestException(
        `Invalid state transition: Cannot change status from ${currentStatus} to ${nextStatus}`,
      );
    }

    // Document Validation before Approval
    if (nextStatus === 'Approved') {
      const userProfile = await this.userProfileModel
        .findOne({ userId: user._id })
        .exec();
      if (!userProfile) {
        throw new BadRequestException(
          'Cannot approve user: User profile is missing.',
        );
      }

      const taxFormCount = userProfile.taxFormUrl ? 1 : 0;
      const identityDocCount = userProfile.identityDocs?.length || 0;

      if (taxFormCount < 1 || identityDocCount < 2) {
        throw new BadRequestException(
          `Cannot approve user: Missing required onboarding documents (Requires at least 1 tax form and 2 identity documents). Current: Tax Forms: ${taxFormCount}, Identity Docs: ${identityDocCount}`,
        );
      }
    }

    const oldOnboardingStatus = user.onboardingStatus;
    user.status = nextStatus;

    // Transition Logic
    if (nextStatus === 'Approved') {
      user.isActive = true;
      user.onboardingStatus = 'approved';
      user.adminFeedback = '';

      // Role Mapping
      let systemRole = 'User';
      let roleName = 'User';

      switch (user.contractorType) {
        case 'Production Company':
          systemRole = 'Manager';
          roleName = 'Production Manager';
          break;
        case 'Admin':
          systemRole = 'Admin';
          roleName = 'Admin';
          break;
        default:
          systemRole = 'User';
          roleName = 'User';
          break;
      }

      user.systemRole = systemRole;
      const dbRole = await this.roleModel.findOne({ name: roleName }).exec();
      if (dbRole) {
        user.roleId = dbRole._id;
      }
    } else if (nextStatus === 'Changes Requested') {
      user.isActive = false;
      user.onboardingStatus = 'changes-requested';
      user.roleId = null;
      user.adminFeedback =
        updateDto.adminFeedback ||
        'Please review and update your onboarding details.';
    } else {
      user.isActive = false;
      if (nextStatus === 'Pending' || nextStatus === 'UnderReview') {
        user.onboardingStatus = 'pending-review';
      } else if (nextStatus === 'Draft') {
        user.onboardingStatus = 'in-progress';
      }
    }

    await user.save();

    // Create Audit Log
    if (oldOnboardingStatus !== user.onboardingStatus) {
      await this.auditLogsService.create(
        actorId,
        user._id.toString(),
        'USER_ONBOARDING_STATUS_CHANGE',
        {
          oldStatus: oldOnboardingStatus,
          newStatus: user.onboardingStatus,
        },
      );
    }

    return this.findOne(id);
  }
}

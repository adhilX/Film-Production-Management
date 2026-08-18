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

    if (user.onboardingStatus === 'approved') {
      throw new BadRequestException('Onboarding has already been approved');
    }

    if (currentStep !== undefined && (currentStep < 1 || currentStep > 6)) {
      throw new BadRequestException('Invalid step number');
    }

    // Defense-in-depth: do not allow normal users to directly manipulate administrative fields
    if (profileData) {
      delete profileData.systemRoleId;
      delete profileData.onboardingStatus;
      delete profileData.status;
      delete profileData.isActive;
      delete profileData.adminFeedback;
    }

    let profile = await this.userProfileModel
      .findOne({ userId: user._id })
      .exec();
    if (!profile) {
      profile = new this.userProfileModel({ userId: user._id });
    }

    // Determine target step for verification
    const targetStep = Math.max(1, currentStep !== undefined ? currentStep : (user.currentStep || 1));

    // Resolve current values (incoming payload + database)
    const contractorType = profileData?.contractorType !== undefined ? profileData.contractorType : user.contractorType;
    const name = profileData?.name !== undefined ? profileData.name : user.name;
    const photoUrl = profileData?.photoUrl !== undefined ? profileData.photoUrl : profile?.photoUrl;
    const phoneNumber = profileData?.phoneNumber !== undefined ? profileData.phoneNumber : profile?.phoneNumber;
    const department = profileData?.department !== undefined ? profileData.department : profile?.department;
    const position = profileData?.position !== undefined ? profileData.position : profile?.position;
    
    let experienceVal = profileData?.experience;
    if (experienceVal === undefined) {
      experienceVal = profile?.experience;
    }
    const experienceStr = Array.isArray(experienceVal) ? experienceVal.join('\n') : (experienceVal || '');

    const bankName = profileData?.bankDetails?.bankName !== undefined ? profileData.bankDetails.bankName : profile?.bankDetails?.bankName;
    const accountNumber = profileData?.bankDetails?.accountNumber !== undefined ? profileData.bankDetails.accountNumber : profile?.bankDetails?.accountNumber;
    const routingNumber = profileData?.bankDetails?.routingNumber !== undefined ? profileData.bankDetails.routingNumber : profile?.bankDetails?.routingNumber;
    const taxFormUrl = profileData?.taxFormUrl !== undefined ? profileData.taxFormUrl : profile?.taxFormUrl;

    const governmentIdType = profileData?.governmentIdType !== undefined ? profileData.governmentIdType : profile?.governmentIdType;
    const identityDocs = profileData?.identityDocs !== undefined ? profileData.identityDocs : (profile?.identityDocs || []);

    const agreeNda = profileData?.agreeNda !== undefined ? profileData.agreeNda : (profile?.signedNda || false);
    const agreeTerms = profileData?.agreeTerms !== undefined ? profileData.agreeTerms : (profile?.signedTerms || false);
    const signatureData = profileData?.signatureData !== undefined ? profileData.signatureData : profile?.signatureData;

    // Run sequence validations
    if (targetStep > 1) {
      if (!contractorType || contractorType.trim() === '') {
        throw new BadRequestException('Contractor type is required');
      }
    }
    if (targetStep > 2) {
      if (!name || name.trim().length < 2) {
        throw new BadRequestException('Name must be at least 2 characters');
      }
      if (!photoUrl || photoUrl.trim() === '') {
        throw new BadRequestException('Profile photo is required');
      }
      if (!phoneNumber || phoneNumber.trim().length < 5) {
        throw new BadRequestException('Phone number must be at least 5 digits');
      }
      if (!department || department.trim() === '') {
        throw new BadRequestException('Department is required');
      }
      if (!position || position.trim() === '') {
        throw new BadRequestException('Position is required');
      }
      if (!experienceStr || experienceStr.trim().length < 10) {
        throw new BadRequestException('Experience summary must be at least 10 characters');
      }
    }
    if (targetStep > 3) {
      if (!bankName || bankName.trim() === '') {
        throw new BadRequestException('Bank name is required');
      }
      if (!accountNumber || accountNumber.trim().length < 5) {
        throw new BadRequestException('Account number must be at least 5 digits');
      }
      if (!routingNumber || routingNumber.trim().length < 5) {
        throw new BadRequestException('Routing number must be at least 5 digits');
      }
      if (!taxFormUrl || taxFormUrl.trim() === '') {
        throw new BadRequestException('Tax document is required');
      }
    }
    if (targetStep > 4) {
      if (!governmentIdType || governmentIdType.trim() === '') {
        throw new BadRequestException('Government ID type is required');
      }
      if (!identityDocs || identityDocs.length < 2) {
        throw new BadRequestException('Both front and back ID documents are required');
      }
    }
    if (targetStep > 5) {
      if (agreeNda !== true) {
        throw new BadRequestException('NDA agreement is required');
      }
      if (agreeTerms !== true) {
        throw new BadRequestException('Terms agreement is required');
      }
      if (!signatureData || signatureData.trim() === '') {
        throw new BadRequestException('Digital signature is required');
      }
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


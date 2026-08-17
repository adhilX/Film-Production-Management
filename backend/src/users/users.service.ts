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
    const query: any = {};

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
        path: 'systemRoleId',
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


}

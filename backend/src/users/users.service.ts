import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().populate('roleId').select('-passwordHash').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate('roleId').select('-passwordHash').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateOnboarding(id: string, updateDto: UpdateOnboardingDto): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentStatus = user.status;
    const nextStatus = updateDto.status;

    // Validate 5-state state machine transitions
    // State progression: Draft -> Pending -> UnderReview -> Approved / Rejected
    const allowedTransitions: Record<string, string[]> = {
      Draft: ['Pending'],
      Pending: ['UnderReview', 'Approved', 'Rejected'],
      UnderReview: ['Approved', 'Rejected'],
      Approved: ['UnderReview', 'Rejected'], // Allow re-review or rejection if needed
      Rejected: ['UnderReview', 'Pending'], // Allow re-submission/re-review
    };

    if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid state transition: Cannot change status from ${currentStatus} to ${nextStatus}`,
      );
    }

    user.status = nextStatus;

    // If status is Approved, mark the user as active
    if (nextStatus === 'Approved') {
      user.isActive = true;
    } else {
      user.isActive = false;
    }

    // Apply systemRole if provided and match with MongoDB Role collections
    if (updateDto.systemRole) {
      user.systemRole = updateDto.systemRole;
      const roleName = updateDto.systemRole === 'Admin' ? 'Admin' : updateDto.systemRole === 'Manager' ? 'Production Manager' : 'User';
      const dbRole = await this.roleModel.findOne({ name: roleName }).exec();
      if (dbRole) {
        user.roleId = dbRole._id as Types.ObjectId;
      }
    }

    await user.save();
    return this.findOne(id);
  }
}

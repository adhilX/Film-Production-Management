import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CastCrew, CastCrewDocument } from '../schemas/cast-crew.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class CastCrewEligibilityService {
  constructor(
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getEligibleCast(productionId: string): Promise<any[]> {
    const assignedCastCrew = await this.castCrewModel.find({
      productionId: new Types.ObjectId(productionId),
      characterId: { $ne: null }
    }).select('userId').lean().exec();
    const assignedUserIds = assignedCastCrew.map(c => c.userId);

    const eligible = await this.userModel.find({
      _id: { $nin: assignedUserIds },
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: { $in: ['Cast', 'Freelancer', 'None'] }
    }).populate('profile').lean().exec();

    return eligible.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: (u as any).profile?.photoUrl || null
    }));
  }

  async getEligibleCrew(productionId: string): Promise<any[]> {
    const assignedCastCrew = await this.castCrewModel.find({
      productionId: new Types.ObjectId(productionId)
    }).select('userId').lean().exec();
    const assignedUserIds = assignedCastCrew.map(c => c.userId);

    const eligible = await this.userModel.find({
      _id: { $nin: assignedUserIds },
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: { $ne: 'Cast' }
    }).populate('profile').lean().exec();

    return eligible.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: (u as any).profile?.photoUrl || null
    }));
  }
}

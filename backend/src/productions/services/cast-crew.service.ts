import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CastCrew, CastCrewDocument } from '../schemas/cast-crew.schema';
import { Character, CharacterDocument } from '../schemas/character.schema';
import { Production, ProductionDocument } from '../schemas/production.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { AssignCastCrewDto } from '../dto/assign-cast-crew.dto';
import { UpdateCastCrewDto } from '../dto/update-cast-crew.dto';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

import { CastCrewEligibilityService } from './cast-crew-eligibility.service';

@Injectable()
export class CastCrewService {
  constructor(
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
    @InjectModel(Character.name) private readonly characterModel: Model<CharacterDocument>,
    @InjectModel(Production.name) private readonly productionModel: Model<ProductionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => AuditLogsService))
    private readonly auditLogsService: AuditLogsService,
    private readonly castCrewEligibilityService: CastCrewEligibilityService,
  ) {}

  async assignCastCrew(
    productionId: string,
    assignDto: AssignCastCrewDto,
    requesterId: string,
  ): Promise<CastCrew> {
    const { userId, roleInProduction, characterId } = assignDto;

    // Verify user exists and is active/approved
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestException('Cannot assign an inactive/pending user');
    }
    if (user.onboardingStatus !== 'approved') {
      throw new BadRequestException('Cannot assign user whose onboarding is not approved');
    }

    // Verify production exists
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    // Check if the user is already assigned to this project
    const existingCastCrew = await this.castCrewModel.findOne({
      userId: new Types.ObjectId(userId),
      productionId: new Types.ObjectId(productionId),
    }).exec();
    if (existingCastCrew) {
      throw new BadRequestException('User is already assigned to this project.');
    }

    let charObjId: Types.ObjectId | null = null;
    if (characterId) {
      const char = await this.characterModel.findById(characterId).exec();
      if (!char) {
        throw new BadRequestException('Character not found');
      }
      if (char.productionId.toString() !== productionId) {
        throw new BadRequestException('Character does not belong to this project');
      }
      if (char.assignments && char.assignments.length > 0) {
        throw new BadRequestException('Character is already assigned to another cast member');
      }

      // Check actor exclusivity
      const userAssignedChar = await this.castCrewModel.findOne({
        productionId: new Types.ObjectId(productionId),
        userId: new Types.ObjectId(userId),
        characterId: { $ne: null }
      }).exec();
      if (userAssignedChar) {
        throw new BadRequestException('Cast member is already assigned to another character in this project.');
      }

      charObjId = char._id;

      // Update Character Assignments
      if (!char.assignments.some((id) => id.toString() === userId)) {
        char.assignments.push(new Types.ObjectId(userId));
        await char.save();
      }
    }

    const castCrew = new this.castCrewModel({
      userId: new Types.ObjectId(userId),
      productionId: new Types.ObjectId(productionId),
      roleInProduction,
      characterId: charObjId,
    });

    await castCrew.save();

    const action = characterId ? 'CAST_ASSIGNED' : 'CREW_ASSIGNED';
    await this.auditLogsService.log(
      requesterId,
      action,
      castCrew._id.toString(),
      'CastCrew',
      '',
      JSON.stringify({ userId, roleInProduction, characterId }),
      undefined,
      'Productions',
      { productionId }
    );

    return castCrew;
  }

  async getCastCrew(productionId: string): Promise<any[]> {
    return this.castCrewModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate({
        path: 'userId',
        select: '-passwordHash',
        populate: { path: 'profile' }
      })
      .populate('characterId')
      .exec();
  }

  async updateCastCrew(
    productionId: string,
    castCrewId: string,
    updateDto: UpdateCastCrewDto,
    requesterId: string,
  ): Promise<CastCrew> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const castCrew = await this.castCrewModel.findById(castCrewId).exec();
    if (!castCrew) {
      throw new NotFoundException('Assignment not found');
    }

    if (castCrew.productionId.toString() !== productionId) {
      throw new NotFoundException('Assignment not found');
    }

    const oldState = JSON.stringify({
      roleInProduction: castCrew.roleInProduction,
      characterId: castCrew.characterId ? castCrew.characterId.toString() : null
    });

    const oldCharId = castCrew.characterId;

    if (updateDto.characterId !== undefined) {
      const newCharId = updateDto.characterId;

      if (oldCharId?.toString() !== newCharId) {
        // 1. Remove user from old character assignments
        if (oldCharId) {
          const oldChar = await this.characterModel.findById(oldCharId).exec();
          if (oldChar) {
            oldChar.assignments = oldChar.assignments.filter(
              id => id.toString() !== castCrew.userId.toString()
            );
            await oldChar.save();
          }
        }

        // 2. Add user to new character assignments
        if (newCharId) {
          const char = await this.characterModel.findById(newCharId).exec();
          if (!char) {
            throw new NotFoundException('Character not found');
          }
          if (char.productionId.toString() !== productionId) {
            throw new BadRequestException('Character does not belong to this project');
          }

          // Exclusivity: character assigned to another actor?
          if (char.assignments && char.assignments.length > 0) {
            throw new BadRequestException('Character is already assigned to another cast member');
          }

          // Exclusivity: actor assigned to another character?
          const otherAssigned = await this.castCrewModel.findOne({
            productionId: new Types.ObjectId(productionId),
            userId: castCrew.userId,
            _id: { $ne: castCrew._id },
            characterId: { $ne: null }
          }).exec();
          if (otherAssigned) {
            throw new BadRequestException('Cast member is already assigned to another character in this project.');
          }

          if (!char.assignments.some(id => id.toString() === castCrew.userId.toString())) {
            char.assignments.push(new Types.ObjectId(castCrew.userId));
            await char.save();
          }

          castCrew.characterId = new Types.ObjectId(newCharId);
        } else {
          castCrew.characterId = null;
        }
      }
    }

    if (updateDto.roleInProduction !== undefined) {
      castCrew.roleInProduction = updateDto.roleInProduction;
    }

    await castCrew.save();

    const newState = JSON.stringify({
      roleInProduction: castCrew.roleInProduction,
      characterId: castCrew.characterId ? castCrew.characterId.toString() : null
    });

    let finalAction = 'CAST_UPDATED';
    if (oldCharId && !castCrew.characterId) {
      finalAction = 'CAST_REMOVED';
    } else if (!oldCharId && castCrew.characterId) {
      finalAction = 'CAST_ASSIGNED';
    } else if (!castCrew.characterId) {
      finalAction = 'CREW_UPDATED';
    }

    await this.auditLogsService.log(
      requesterId,
      finalAction,
      castCrew._id.toString(),
      'CastCrew',
      oldState,
      newState,
      undefined,
      'Productions',
      { productionId }
    );

    return castCrew;
  }

  async removeCastCrew(
    productionId: string,
    castCrewId: string,
    requesterId: string,
  ): Promise<void> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const castCrew = await this.castCrewModel.findById(castCrewId).exec();
    if (!castCrew) {
      throw new NotFoundException('Assignment not found');
    }

    if (castCrew.productionId.toString() !== productionId) {
      throw new NotFoundException('Assignment not found');
    }

    const oldState = JSON.stringify({
      userId: castCrew.userId.toString(),
      roleInProduction: castCrew.roleInProduction,
      characterId: castCrew.characterId ? castCrew.characterId.toString() : null
    });

    if (castCrew.characterId) {
      const char = await this.characterModel.findById(castCrew.characterId).exec();
      if (char) {
        char.assignments = char.assignments.filter(
          id => id.toString() !== castCrew.userId.toString()
        );
        await char.save();
      }
    }

    await this.castCrewModel.findByIdAndDelete(castCrewId).exec();

    const action = castCrew.characterId ? 'CAST_REMOVED' : 'CREW_REMOVED';
    await this.auditLogsService.log(
      requesterId,
      action,
      castCrewId,
      'CastCrew',
      oldState,
      '',
      undefined,
      'Productions',
      { productionId }
    );
  }

  async getEligibleCast(productionId: string): Promise<any[]> {
    return this.castCrewEligibilityService.getEligibleCast(productionId);
  }

  async getEligibleCrew(productionId: string): Promise<any[]> {
    return this.castCrewEligibilityService.getEligibleCrew(productionId);
  }

  async getProductionIdsForUser(userId: string): Promise<Types.ObjectId[]> {
    const assignments = await this.castCrewModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('productionId')
      .lean()
      .exec();
    return assignments.map(a => a.productionId);
  }
}

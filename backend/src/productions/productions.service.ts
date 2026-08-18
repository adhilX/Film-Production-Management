import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Production, ProductionDocument } from './schemas/production.schema';
import { CastCrew, CastCrewDocument } from './schemas/cast-crew.schema';
import { Character, CharacterDocument } from './schemas/character.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateProductionDto } from './dto/create-production.dto';
import { AssignCastCrewDto } from './dto/assign-cast-crew.dto';
import { UpdateCastCrewDto } from './dto/update-cast-crew.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProductionsService {
  constructor(
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectModel(CastCrew.name) private castCrewModel: Model<CastCrewDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createDto: CreateProductionDto,
    creatorId: string,
    isAdmin: boolean,
  ): Promise<Production> {
    // Validate the productionManager
    const managerUser = await this.userModel.findById(createDto.productionManager)
      .populate({
        path: 'systemRoleId',
        populate: { path: 'permissions' }
      })
      .exec();
    if (!managerUser) {
      throw new NotFoundException('Selected Production Manager not found');
    }
    if (!managerUser.isActive) {
      throw new BadRequestException('Selected Production Manager is inactive');
    }
    const roleObj: any = managerUser.systemRoleId;
    const permissionsList: any[] = roleObj?.permissions || [];
    const hasUpdatePerm = permissionsList.some(p => p.name === 'productions.update');
    if (!hasUpdatePerm) {
      throw new BadRequestException('Selected user is not eligible to act as a Production Manager');
    }

    // Validate budget
    if (createDto.budget < 0) {
      throw new BadRequestException('Budget cannot be negative');
    }

    // Validate dates
    if (new Date(createDto.startDate) > new Date(createDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const prod = new this.productionModel({
      ...createDto,
      productionManager: new Types.ObjectId(createDto.productionManager),
    });
    await prod.save();

    // Map the creator to the production in CastCrew so they have resource scope access
    const creatorMapping = await this.castCrewModel.findOne({
      userId: new Types.ObjectId(creatorId),
      productionId: prod._id,
    }).exec();
    
    if (!creatorMapping) {
      const castCrewCreator = new this.castCrewModel({
        userId: new Types.ObjectId(creatorId),
        productionId: prod._id,
        roleInProduction: isAdmin ? 'Super Admin' : 'Production Manager',
      });
      await castCrewCreator.save();
    }

    // Automatically map the assigned productionManager if different from creator
    if (creatorId !== createDto.productionManager) {
      const managerMapping = await this.castCrewModel.findOne({
        userId: managerUser._id,
        productionId: prod._id,
      }).exec();
      
      if (!managerMapping) {
        const castCrewManager = new this.castCrewModel({
          userId: managerUser._id,
          productionId: prod._id,
          roleInProduction: 'Production Manager',
        });
        await castCrewManager.save();
      }
    }

    return prod;
  }

  async findAll(userId: string, isAdmin: boolean): Promise<Production[]> {
    if (isAdmin) {
      return this.productionModel.find().populate('productionManager', '-passwordHash').exec();
    }

    // Filter productions by user assignments
    const mappings = await this.castCrewModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
    const productionIds = mappings.map((m) => m.productionId);
    return this.productionModel.find({ _id: { $in: productionIds } }).populate('productionManager', '-passwordHash').exec();
  }

  async findOne(id: string): Promise<Production> {
    const prod = await this.productionModel.findById(id).populate('productionManager', '-passwordHash').exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }
    return prod;
  }

  async update(
    id: string,
    updateDto: UpdateProductionDto,
  ): Promise<Production> {
    const prod = await this.productionModel.findById(id).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    // Status Validation State Machine
    if (updateDto.status && updateDto.status !== prod.status) {
      const validTransitions = {
        'Draft': ['Active', 'Cancelled'],
        'Active': ['On Hold', 'Completed', 'Cancelled'],
        'On Hold': ['Active', 'Cancelled'],
        'Completed': [],
        'Cancelled': []
      };
      
      const allowed = validTransitions[prod.status] || [];
      if (!allowed.includes(updateDto.status)) {
        throw new BadRequestException(
          `Invalid status transition: ${prod.status} to ${updateDto.status}`,
        );
      }
      prod.status = updateDto.status;
    }

    // Production Manager Validation & Mapping
    if (updateDto.productionManager) {
      const managerUser = await this.userModel.findById(updateDto.productionManager)
        .populate({
          path: 'systemRoleId',
          populate: { path: 'permissions' }
        })
        .exec();
      if (!managerUser) {
        throw new NotFoundException('Selected Production Manager not found');
      }
      if (!managerUser.isActive) {
        throw new BadRequestException('Selected Production Manager is inactive');
      }
      const roleObj: any = managerUser.systemRoleId;
      const permissionsList: any[] = roleObj?.permissions || [];
      const hasUpdatePerm = permissionsList.some(p => p.name === 'productions.update');
      if (!hasUpdatePerm) {
        throw new BadRequestException('Selected user is not eligible to act as a Production Manager');
      }
      
      prod.productionManager = new Types.ObjectId(updateDto.productionManager) as any;

      // Ensure the new Production Manager is mapped in CastCrew
      const existingMapping = await this.castCrewModel.findOne({
        userId: managerUser._id,
        productionId: prod._id
      }).exec();
      
      if (!existingMapping) {
        const castCrew = new this.castCrewModel({
          userId: managerUser._id,
          productionId: prod._id,
          roleInProduction: 'Production Manager',
        });
        await castCrew.save();
      }
    }

    // Update other metadata fields
    if (updateDto.title) prod.title = updateDto.title;
    if (updateDto.description !== undefined) prod.description = updateDto.description;
    if (updateDto.genre) prod.genre = updateDto.genre;
    if (updateDto.language) prod.language = updateDto.language;
    if (updateDto.format) prod.format = updateDto.format;
    if (updateDto.logline !== undefined) prod.logline = updateDto.logline;
    if (updateDto.synopsis !== undefined) prod.synopsis = updateDto.synopsis;
    if (updateDto.imageUrl !== undefined) prod.imageUrl = updateDto.imageUrl;

    if (updateDto.budget !== undefined) {
      if (updateDto.budget < 0) {
        throw new BadRequestException('Budget cannot be negative');
      }
      prod.budget = updateDto.budget;
    }

    const newStart = updateDto.startDate ? new Date(updateDto.startDate) : prod.startDate;
    const newEnd = updateDto.endDate ? new Date(updateDto.endDate) : prod.endDate;
    if (newStart && newEnd && newStart > newEnd) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (updateDto.startDate) prod.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) prod.endDate = new Date(updateDto.endDate);

    await prod.save();
    return this.findOne(prod._id.toString());
  }


  async assignCastCrew(
    productionId: string,
    assignDto: AssignCastCrewDto,
    requesterId: string,
  ): Promise<CastCrew> {
    const { userId, roleInProduction, characterId } = assignDto;

    // Verify user exists and is active/approved
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
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
        throw new NotFoundException('Character not found');
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
      throw new BadRequestException('Assignment does not belong to this project');
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
      throw new BadRequestException('Assignment does not belong to this project');
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

  async createCharacter(
    productionId: string,
    createDto: CreateCharacterDto,
    requesterId: string,
  ): Promise<Character> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const character = new this.characterModel({
      ...createDto,
      productionId: new Types.ObjectId(productionId),
      assignments: [],
    });

    await character.save();

    await this.auditLogsService.log(
      requesterId,
      'CHARACTER_CREATED',
      character._id.toString(),
      'Character',
      '',
      JSON.stringify({ name: character.name, description: character.description }),
      undefined,
      'Productions',
      { productionId }
    );

    return character;
  }

  async getCharacters(productionId: string): Promise<Character[]> {
    return this.characterModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate({
        path: 'assignments',
        select: '-passwordHash',
        populate: { path: 'profile' }
      })
      .exec();
  }

  async updateCharacter(
    productionId: string,
    characterId: string,
    updateDto: UpdateCharacterDto,
    requesterId: string,
  ): Promise<Character> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    if (character.productionId.toString() !== productionId) {
      throw new BadRequestException('Character does not belong to this project');
    }

    const oldState = JSON.stringify({ name: character.name, description: character.description });

    if (updateDto.name !== undefined) {
      character.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      character.description = updateDto.description;
    }

    await character.save();

    const newState = JSON.stringify({ name: character.name, description: character.description });

    await this.auditLogsService.log(
      requesterId,
      'CHARACTER_UPDATED',
      character._id.toString(),
      'Character',
      oldState,
      newState,
      undefined,
      'Productions',
      { productionId }
    );

    return character;
  }

  async deleteCharacter(
    productionId: string,
    characterId: string,
    requesterId: string,
  ): Promise<void> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    if (character.productionId.toString() !== productionId) {
      throw new BadRequestException('Character does not belong to this project');
    }

    const oldState = JSON.stringify({ name: character.name, description: character.description });

    // Nullify references in CastCrew
    await this.castCrewModel.updateMany(
      { productionId: new Types.ObjectId(productionId), characterId: new Types.ObjectId(characterId) },
      { $set: { characterId: null } }
    ).exec();

    await this.characterModel.findByIdAndDelete(characterId).exec();

    await this.auditLogsService.log(
      requesterId,
      'CHARACTER_DELETED',
      characterId,
      'Character',
      oldState,
      '',
      undefined,
      'Productions',
      { productionId }
    );
  }

  async getEligibleCast(productionId: string): Promise<any[]> {
    const users = await this.userModel.find({
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: { $in: ['Cast', 'Freelancer', 'None'] }
    }).populate('profile').exec();

    const assignedCastCrew = await this.castCrewModel.find({
      productionId: new Types.ObjectId(productionId),
      characterId: { $ne: null }
    }).exec();
    const assignedUserIds = new Set(assignedCastCrew.map(c => c.userId.toString()));

    const eligible = users.filter(u => !assignedUserIds.has(u._id.toString()));

    return eligible.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: u.profile?.photoUrl || null
    }));
  }

  async getEligibleCrew(productionId: string): Promise<any[]> {
    const users = await this.userModel.find({
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: { $ne: 'Cast' }
    }).populate('profile').exec();

    const assignedCastCrew = await this.castCrewModel.find({
      productionId: new Types.ObjectId(productionId)
    }).exec();
    const assignedUserIds = new Set(assignedCastCrew.map(c => c.userId.toString()));

    const eligible = users.filter(u => !assignedUserIds.has(u._id.toString()));

    return eligible.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: u.profile?.photoUrl || null
    }));
  }

  async findEligibleManagers(): Promise<any[]> {
    const users = await this.userModel
      .find({
        isActive: true,
        onboardingStatus: 'approved',
      })
      .populate({
        path: 'systemRoleId',
        populate: { path: 'permissions' },
      })
      .exec();

    const eligible = users.filter((user) => {
      const roleObj: any = user.systemRoleId;
      const permissionsList: any[] = roleObj?.permissions || [];
      return permissionsList.some((p) => p.name === 'productions.update');
    });

    return eligible.map((user) => ({
      _id: user._id,
      name: user.name,
    }));
  }
}

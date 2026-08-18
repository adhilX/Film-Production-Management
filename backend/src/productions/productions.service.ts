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
import { CreateCharacterDto } from './dto/create-character.dto';

import { UpdateProductionDto } from './dto/update-production.dto';

@Injectable()
export class ProductionsService {
  constructor(
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectModel(CastCrew.name) private castCrewModel: Model<CastCrewDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
  ): Promise<CastCrew> {
    const { userId, roleInProduction, characterId } = assignDto;

    // Verify user exists and is active
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestException('Cannot assign an inactive/pending user');
    }

    // Verify production exists
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    let charObjId: Types.ObjectId | null = null;
    if (characterId) {
      const char = await this.characterModel.findById(characterId).exec();
      if (!char) {
        throw new NotFoundException('Character not found');
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
    return castCrew;
  }

  async getCastCrew(productionId: string): Promise<any[]> {
    return this.castCrewModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('userId', '-passwordHash')
      .populate('characterId')
      .exec();
  }

  async createCharacter(
    productionId: string,
    createDto: CreateCharacterDto,
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
    return character;
  }

  async getCharacters(productionId: string): Promise<Character[]> {
    return this.characterModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('assignments', '-passwordHash')
      .exec();
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

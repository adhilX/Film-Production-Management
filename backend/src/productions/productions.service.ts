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
    systemRole: string,
  ): Promise<Production> {
    const prod = new this.productionModel(createDto);
    await prod.save();

    // Map the creator to the production in CastCrew so they have resource scope access
    const castCrew = new this.castCrewModel({
      userId: new Types.ObjectId(creatorId),
      productionId: prod._id,
      roleInProduction:
        systemRole === 'Admin' ? 'Super Admin' : 'Production Manager',
    });
    await castCrew.save();

    return prod;
  }

  async findAll(userId: string, systemRole: string): Promise<Production[]> {
    if (systemRole === 'Admin') {
      return this.productionModel.find().exec();
    }

    // Filter productions by user assignments
    const mappings = await this.castCrewModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
    const productionIds = mappings.map((m) => m.productionId);
    return this.productionModel.find({ _id: { $in: productionIds } }).exec();
  }

  async findOne(id: string): Promise<Production> {
    const prod = await this.productionModel.findById(id).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }
    return prod;
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
}

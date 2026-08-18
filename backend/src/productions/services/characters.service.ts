import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Character, CharacterDocument } from '../schemas/character.schema';
import { CastCrew, CastCrewDocument } from '../schemas/cast-crew.schema';
import { Production, ProductionDocument } from '../schemas/production.schema';
import { CreateCharacterDto } from '../dto/create-character.dto';
import { UpdateCharacterDto } from '../dto/update-character.dto';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

@Injectable()
export class CharactersService {
  constructor(
    @InjectModel(Character.name) private readonly characterModel: Model<CharacterDocument>,
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
    @InjectModel(Production.name) private readonly productionModel: Model<ProductionDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createCharacter(
    productionId: string,
    createDto: CreateCharacterDto,
    requesterId: string,
  ): Promise<Character> {
    const prod = await this.productionModel.findById(productionId).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const existing = await this.characterModel.findOne({
      productionId: new Types.ObjectId(productionId),
      name: createDto.name.trim(),
    }).exec();
    if (existing) {
      throw new BadRequestException('A character with this name already exists in this project');
    }

    const character = new this.characterModel({
      ...createDto,
      name: createDto.name.trim(),
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
      throw new NotFoundException('Character not found');
    }

    const oldState = JSON.stringify({ name: character.name, description: character.description });

    if (updateDto.name !== undefined) {
      const trimmedName = updateDto.name.trim();
      if (trimmedName !== character.name) {
        const existing = await this.characterModel.findOne({
          productionId: new Types.ObjectId(productionId),
          name: trimmedName,
          _id: { $ne: new Types.ObjectId(characterId) },
        }).exec();
        if (existing) {
          throw new BadRequestException('A character with this name already exists in this project');
        }
        character.name = trimmedName;
      }
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
      throw new NotFoundException('Character not found');
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
}

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
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { Permission, PermissionDocument } from '../auth/schemas/permission.schema';
import { CreateProductionDto } from './dto/create-production.dto';
import { AssignCastCrewDto } from './dto/assign-cast-crew.dto';
import { UpdateCastCrewDto } from './dto/update-cast-crew.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { GetProductionsQueryDto } from './dto/get-productions-query.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CastCrewService } from './services/cast-crew.service';
import { CharactersService } from './services/characters.service';
import { getPaginationParams, calculateTotalPages } from '../common/utils/pagination.util';

@Injectable()
export class ProductionsService {
  constructor(
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectModel(CastCrew.name) private castCrewModel: Model<CastCrewDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    private readonly auditLogsService: AuditLogsService,
    private readonly castCrewService: CastCrewService,
    private readonly charactersService: CharactersService,
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

    const { startDate, endDate } = createDto;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const prod = new this.productionModel({
      ...createDto,
      status: 'Draft',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    await prod.save();

    // Auto-assign the Production Manager to CastCrew
    const castCrew = new this.castCrewModel({
      userId: managerUser._id,
      productionId: prod._id,
      roleInProduction: 'Production Manager',
    });
    await castCrew.save();

    await this.auditLogsService.log(
      creatorId,
      'PROJECT_CREATED',
      prod._id.toString(),
      'Production',
      '',
      JSON.stringify(prod),
      undefined,
      'Productions',
      { productionId: prod._id.toString() }
    );

    return prod;
  }

  async findAll(userId: string, isAdmin: boolean, queryDto?: GetProductionsQueryDto): Promise<any> {
    const page = queryDto?.page ? Number(queryDto.page) : undefined;
    const limit = queryDto?.limit ? Number(queryDto.limit) : undefined;
    const search = queryDto?.search || '';
    const status = queryDto?.status || 'All';
    const genre = queryDto?.genre || 'All';
    const productionManager = queryDto?.productionManager || 'All';
    const sortBy = queryDto?.sortBy || 'createdAt';
    const sortOrder = queryDto?.sortOrder || 'desc';

    // 1. Build project query/filter matching assignments or Admin access
    const projectFilter: any = {};
    if (!isAdmin) {
      const mappings = await this.castCrewModel
        .find({ userId: new Types.ObjectId(userId) })
        .exec();
      const productionIds = mappings.map((m) => m.productionId);
      projectFilter._id = { $in: productionIds };
    }

    // Apply Search (case-insensitive regex matching title)
    if (search) {
      projectFilter.title = { $regex: search, $options: 'i' };
    }

    // Apply Status Filter
    if (status && status !== 'All') {
      projectFilter.status = status;
    }

    // Apply Genre Filter
    if (genre && genre !== 'All') {
      projectFilter.genre = genre;
    }

    // Apply Manager Filter
    if (productionManager && productionManager !== 'All') {
      projectFilter.productionManager = new Types.ObjectId(productionManager);
    }

    // 2. Decide if returning paginated or raw array
    if (page === undefined && limit === undefined) {
      // Return raw Production[] array
      return this.productionModel
        .find(projectFilter)
        .populate('productionManager', '-passwordHash')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .exec();
    }

    // Return paginated response
    const { page: pageNum, limit: limitNum, skip: skipNum } = getPaginationParams(page, limit);

    const [productions, total] = await Promise.all([
      this.productionModel
        .find(projectFilter)
        .populate('productionManager', '-passwordHash')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skipNum)
        .limit(limitNum)
        .exec(),
      this.productionModel.countDocuments(projectFilter).exec()
    ]);

    const pages = calculateTotalPages(total, limitNum) || 1;

    return {
      productions,
      total,
      page: pageNum,
      pages,
      limit: limitNum,
    };
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
    updaterId?: string,
  ): Promise<Production> {
    const prod = await this.productionModel.findById(id).exec();
    if (!prod) {
      throw new NotFoundException('Production not found');
    }

    const previousState = {
      title: prod.title,
      description: prod.description,
      status: prod.status,
      productionManager: prod.productionManager?.toString(),
    };

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

    const newState = {
      title: prod.title,
      description: prod.description,
      status: prod.status,
      productionManager: prod.productionManager?.toString(),
    };

    if (updaterId) {
      await this.auditLogsService.log(
        updaterId,
        'PROJECT_UPDATED',
        prod._id.toString(),
        'Production',
        JSON.stringify(previousState),
        JSON.stringify(newState),
        undefined,
        'Productions',
        { productionId: prod._id.toString() }
      );
    }

    return this.findOne(prod._id.toString());
  }

  // Delegated Cast & Crew actions
  assignCastCrew(productionId: string, assignDto: AssignCastCrewDto, requesterId: string) {
    return this.castCrewService.assignCastCrew(productionId, assignDto, requesterId);
  }

  getCastCrew(productionId: string) {
    return this.castCrewService.getCastCrew(productionId);
  }

  updateCastCrew(productionId: string, castCrewId: string, updateDto: UpdateCastCrewDto, requesterId: string) {
    return this.castCrewService.updateCastCrew(productionId, castCrewId, updateDto, requesterId);
  }

  removeCastCrew(productionId: string, castCrewId: string, requesterId: string) {
    return this.castCrewService.removeCastCrew(productionId, castCrewId, requesterId);
  }

  getEligibleCast(productionId: string) {
    return this.castCrewService.getEligibleCast(productionId);
  }

  getEligibleCrew(productionId: string) {
    return this.castCrewService.getEligibleCrew(productionId);
  }

  // Delegated Characters actions
  createCharacter(productionId: string, createDto: CreateCharacterDto, requesterId: string) {
    return this.charactersService.createCharacter(productionId, createDto, requesterId);
  }

  getCharacters(productionId: string) {
    return this.charactersService.getCharacters(productionId);
  }

  updateCharacter(productionId: string, characterId: string, updateDto: UpdateCharacterDto, requesterId: string) {
    return this.charactersService.updateCharacter(productionId, characterId, updateDto, requesterId);
  }

  deleteCharacter(productionId: string, characterId: string, requesterId: string) {
    return this.charactersService.deleteCharacter(productionId, characterId, requesterId);
  }

  async findEligibleManagers(): Promise<any[]> {
    const permission = await this.permissionModel.findOne({ name: 'productions.update' }).lean().exec();
    if (!permission) {
      return [];
    }

    const roles = await this.roleModel.find({ permissions: permission._id }).lean().exec();
    const roleIds = roles.map(r => r._id);

    const eligible = await this.userModel
      .find({
        isActive: true,
        onboardingStatus: 'approved',
        systemRoleId: { $in: roleIds },
      })
      .select('_id name')
      .lean()
      .exec();

    return eligible.map((user) => ({
      _id: user._id,
      name: user.name,
    }));
  }
}

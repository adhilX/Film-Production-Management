import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Costume, CostumeDocument } from './schemas/costume.schema';
import { CostumeAssignment, CostumeAssignmentDocument } from './schemas/costume-assignment.schema';
import { Character, CharacterDocument } from '../productions/schemas/character.schema';
import { CastCrew, CastCrewDocument } from '../productions/schemas/cast-crew.schema';
import { CreateCostumeDto } from './dto/create-costume.dto';
import { UpdateCostumeDto } from './dto/update-costume.dto';
import { AssignCostumeDto } from './dto/assign-costume.dto';
import { ReturnCostumeDto } from './dto/return-costume.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CostumesService {
  constructor(
    @InjectModel(Costume.name) private readonly costumeModel: Model<CostumeDocument>,
    @InjectModel(CostumeAssignment.name) private readonly assignmentModel: Model<CostumeAssignmentDocument>,
    @InjectModel(Character.name) private readonly characterModel: Model<CharacterDocument>,
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async getSession(): Promise<any> {
    try {
      const connAny = this.connection as any;
      const isReplica = connAny.client?.topology?.description?.type?.includes('ReplicaSet') ||
                        Array.from(connAny.client?.topology?.description?.servers?.values() || []).some(
                          (server: any) => server.type?.includes('ReplicaSet')
                        );
      if (isReplica) {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
      }
    } catch (e) {
      // Fallback to standalone
    }
    return null;
  }

  async create(productionId: string, createDto: CreateCostumeDto, userId: string): Promise<Costume> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid Production ID format');
    }

    const session = await this.getSession();
    try {
      const normalizedName = createDto.name.trim();
      const query = this.costumeModel.findOne({
        productionId: new Types.ObjectId(productionId),
        name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });
      const duplicate = session ? await query.session(session).exec() : await query.exec();
      if (duplicate) {
        throw new ConflictException(`Costume with name "${createDto.name}" already exists in this project.`);
      }

      const costume = new this.costumeModel({
        ...createDto,
        productionId: new Types.ObjectId(productionId),
        availableQuantity: createDto.quantity,
        createdBy: new Types.ObjectId(userId),
        status: createDto.quantity > 0 ? 'Available' : 'Assigned',
      });

      const saved = session ? await costume.save({ session }) : await costume.save();

      await this.auditLogsService.log(
        userId,
        'COSTUME_CREATED',
        saved._id.toString(),
        'Costume',
        '',
        JSON.stringify({ name: saved.name, quantity: saved.quantity }),
        session || undefined,
      );

      if (session) {
        await session.commitTransaction();
      }
      return saved;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async findAll(
    productionId: string,
    status?: string,
    category?: string,
    condition?: string,
    search?: string,
  ): Promise<Costume[]> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid Production ID format');
    }

    const query: any = { productionId: new Types.ObjectId(productionId) };

    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (condition) {
      query.condition = condition;
    }
    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    return this.costumeModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(productionId: string, id: string): Promise<Costume> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const costume = await this.costumeModel
      .findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      })
      .exec();

    if (!costume) {
      throw new NotFoundException(`Costume with ID ${id} not found in this project.`);
    }

    return costume;
  }

  async update(
    productionId: string,
    id: string,
    updateDto: UpdateCostumeDto,
    userId: string,
  ): Promise<Costume> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const session = await this.getSession();
    try {
      const costumeQuery = this.costumeModel.findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      });
      const costume = session ? await costumeQuery.session(session).exec() : await costumeQuery.exec();

      if (!costume) {
        throw new NotFoundException(`Costume with ID ${id} not found in this project.`);
      }

      if (updateDto.name && updateDto.name.trim().toLowerCase() !== costume.name.toLowerCase()) {
        const normalizedName = updateDto.name.trim();
        const dupQuery = this.costumeModel.findOne({
          productionId: new Types.ObjectId(productionId),
          name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
          _id: { $ne: costume._id },
        });
        const duplicate = session ? await dupQuery.session(session).exec() : await dupQuery.exec();
        if (duplicate) {
          throw new ConflictException(`Costume with name "${updateDto.name}" already exists in this project.`);
        }
      }

      // Calculate currently assigned
      const assignmentsQuery = this.assignmentModel.find({
        costumeId: costume._id,
        status: 'Assigned',
      });
      const activeAssignments = session ? await assignmentsQuery.session(session).exec() : await assignmentsQuery.exec();
      const currentlyAssigned = activeAssignments.reduce((acc, curr) => acc + curr.quantity, 0);

      if (updateDto.quantity !== undefined) {
        if (updateDto.quantity < currentlyAssigned) {
          throw new BadRequestException(
            `New quantity cannot be lower than the currently assigned quantity (${currentlyAssigned}).`,
          );
        }
        // Recalculate availableQuantity
        costume.availableQuantity = updateDto.quantity - currentlyAssigned;
        costume.quantity = updateDto.quantity;
      }

      const previousState = JSON.stringify({
        name: costume.name,
        quantity: costume.quantity,
        status: costume.status,
        condition: costume.condition,
      });

      // Update remaining fields
      if (updateDto.name !== undefined) costume.name = updateDto.name;
      if (updateDto.category !== undefined) costume.category = updateDto.category;
      if (updateDto.description !== undefined) costume.description = updateDto.description;
      if (updateDto.size !== undefined) costume.size = updateDto.size;
      if (updateDto.imageUrl !== undefined) costume.imageUrl = updateDto.imageUrl;
      if (updateDto.condition !== undefined) costume.condition = updateDto.condition;
      if (updateDto.status !== undefined) costume.status = updateDto.status;
      costume.updatedBy = new Types.ObjectId(userId);

      // Re-evaluate overall status if availableQuantity > 0
      if (costume.availableQuantity > 0 && costume.status === 'Assigned') {
        costume.status = 'Available';
      }

      const saved = session ? await costume.save({ session }) : await costume.save();

      await this.auditLogsService.log(
        userId,
        'COSTUME_UPDATED',
        saved._id.toString(),
        'Costume',
        previousState,
        JSON.stringify({
          name: saved.name,
          quantity: saved.quantity,
          status: saved.status,
          condition: saved.condition,
        }),
        session || undefined,
      );

      if (session) {
        await session.commitTransaction();
      }
      return saved;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async delete(productionId: string, id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const session = await this.getSession();
    try {
      const costumeQuery = this.costumeModel.findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      });
      const costume = session ? await costumeQuery.session(session).exec() : await costumeQuery.exec();

      if (!costume) {
        throw new NotFoundException(`Costume with ID ${id} not found in this project.`);
      }

      // Check if there are ANY assignments (Assigned or Returned)
      const hasAssignmentsQuery = this.assignmentModel.findOne({ costumeId: costume._id });
      const hasAssignments = session ? await hasAssignmentsQuery.session(session).exec() : await hasAssignmentsQuery.exec();

      if (hasAssignments) {
        throw new ConflictException(
          'Cannot delete costume because it has active assignments or assignment history.',
        );
      }

      const previousState = JSON.stringify({ name: costume.name, quantity: costume.quantity });

      if (session) {
        await this.costumeModel.deleteOne({ _id: costume._id }).session(session).exec();
      } else {
        await this.costumeModel.deleteOne({ _id: costume._id }).exec();
      }

      await this.auditLogsService.log(
        userId,
        'COSTUME_DELETED',
        id,
        'Costume',
        previousState,
        '',
        session || undefined,
      );

      if (session) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async getAssignments(productionId: string): Promise<CostumeAssignment[]> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid Production ID format');
    }

    return this.assignmentModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('costumeId')
      .populate('characterId')
      .populate('assignedTo', 'email name')
      .populate('assignedBy', 'email name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async assign(
    productionId: string,
    costumeId: string,
    assignDto: AssignCostumeDto,
    userId: string,
  ): Promise<CostumeAssignment> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(costumeId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // XOR checks
    const { characterId, userId: targetUserId, quantity } = assignDto;
    if ((characterId && targetUserId) || (!characterId && !targetUserId)) {
      throw new BadRequestException('Exactly one of characterId or userId must be provided');
    }

    const session = await this.getSession();
    try {
      // Find Costume
      const costumeQuery = this.costumeModel.findOne({
        _id: new Types.ObjectId(costumeId),
        productionId: new Types.ObjectId(productionId),
      });
      const costume = session ? await costumeQuery.session(session).exec() : await costumeQuery.exec();

      if (!costume) {
        throw new NotFoundException(`Costume with ID ${costumeId} not found in this project.`);
      }

      // Check target Character
      if (characterId) {
        if (!Types.ObjectId.isValid(characterId)) {
          throw new BadRequestException('Invalid Character ID format');
        }
        const characterQuery = this.characterModel.findOne({
          _id: new Types.ObjectId(characterId),
          productionId: new Types.ObjectId(productionId),
        });
        const character = session ? await characterQuery.session(session).exec() : await characterQuery.exec();
        if (!character) {
          throw new NotFoundException('Character not found in this project');
        }
      }

      // Check target User
      if (targetUserId) {
        if (!Types.ObjectId.isValid(targetUserId)) {
          throw new BadRequestException('Invalid User ID format');
        }
        const castCrewQuery = this.castCrewModel.findOne({
          userId: new Types.ObjectId(targetUserId),
          productionId: new Types.ObjectId(productionId),
        });
        const castCrew = session ? await castCrewQuery.session(session).exec() : await castCrewQuery.exec();
        if (!castCrew) {
          throw new NotFoundException('Cast/crew member not found in this project');
        }
      }

      // Verify availability and decrement atomically to prevent oversubscription/race-conditions
      const updateQuery = {
        _id: costume._id,
        availableQuantity: { $gte: quantity },
      };
      const updateData = {
        $inc: { availableQuantity: -quantity },
      };
      
      const updatedCostume = session
        ? await this.costumeModel.findOneAndUpdate(updateQuery, updateData, { new: true, session }).exec()
        : await this.costumeModel.findOneAndUpdate(updateQuery, updateData, { new: true }).exec();

      if (!updatedCostume) {
        throw new BadRequestException('Insufficient inventory available for assignment');
      }

      // If availableQuantity is now 0, update costume status to Assigned
      if (updatedCostume.availableQuantity === 0) {
        updatedCostume.status = 'Assigned';
        if (session) {
          await updatedCostume.save({ session });
        } else {
          await updatedCostume.save();
        }
      }

      const assignment = new this.assignmentModel({
        productionId: new Types.ObjectId(productionId),
        costumeId: new Types.ObjectId(costumeId),
        characterId: characterId ? new Types.ObjectId(characterId) : null,
        assignedTo: targetUserId ? new Types.ObjectId(targetUserId) : null,
        assignedBy: new Types.ObjectId(userId),
        quantity,
        status: 'Assigned',
        conditionAtAssignment: assignDto.conditionAtAssignment,
        notes: assignDto.notes,
        assignedAt: new Date(),
      });

      const savedAssignment = session ? await assignment.save({ session }) : await assignment.save();

      await this.auditLogsService.log(
        userId,
        'COSTUME_ASSIGNED',
        savedAssignment._id.toString(),
        'CostumeAssignment',
        '',
        JSON.stringify({
          costumeId: costume._id,
          quantity,
          assignedTo: targetUserId || characterId,
        }),
        session || undefined,
      );

      if (session) {
        await session.commitTransaction();
      }
      return savedAssignment;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async return(
    productionId: string,
    assignmentId: string,
    returnDto: ReturnCostumeDto,
    userId: string,
  ): Promise<CostumeAssignment> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(assignmentId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const session = await this.getSession();
    try {
      const assignmentQuery = this.assignmentModel.findOne({
        _id: new Types.ObjectId(assignmentId),
        productionId: new Types.ObjectId(productionId),
      });
      const assignment = session ? await assignmentQuery.session(session).exec() : await assignmentQuery.exec();

      if (!assignment) {
        throw new NotFoundException(`Assignment with ID ${assignmentId} not found in this project.`);
      }

      if (assignment.status === 'Returned') {
        throw new BadRequestException('Assignment is already returned');
      }

      const costumeQuery = this.costumeModel.findById(assignment.costumeId);
      const costume = session ? await costumeQuery.session(session).exec() : await costumeQuery.exec();
      if (!costume) {
        throw new NotFoundException('Related costume not found.');
      }

      const returnQty = returnDto.quantity || assignment.quantity;
      if (returnQty <= 0 || returnQty > assignment.quantity) {
        throw new BadRequestException(`Invalid return quantity. Must be between 1 and ${assignment.quantity}.`);
      }

      let targetAssignment: CostumeAssignmentDocument;

      if (returnQty < assignment.quantity) {
        // Split assignment: original assignment gets decremented
        assignment.quantity -= returnQty;
        if (session) {
          await assignment.save({ session });
        } else {
          await assignment.save();
        }

        // Create new Returned assignment
        const newAssignment = new this.assignmentModel({
          productionId: assignment.productionId,
          costumeId: assignment.costumeId,
          characterId: assignment.characterId,
          assignedTo: assignment.assignedTo,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          returnedAt: new Date(),
          quantity: returnQty,
          status: 'Returned',
          conditionAtAssignment: assignment.conditionAtAssignment,
          conditionAtReturn: returnDto.conditionAtReturn,
          notes: returnDto.notes,
        });

        targetAssignment = session ? await newAssignment.save({ session }) : await newAssignment.save();
      } else {
        // Full return
        assignment.status = 'Returned';
        assignment.returnedAt = new Date();
        assignment.conditionAtReturn = returnDto.conditionAtReturn;
        if (returnDto.notes) {
          assignment.notes = returnDto.notes;
        }
        targetAssignment = session ? await assignment.save({ session }) : await assignment.save();
      }

      // Inventory recovery rules
      if (returnDto.conditionAtReturn === 'Damaged') {
        // Do NOT return to availableQuantity
        costume.condition = 'Damaged';
        costume.status = 'Damaged';
      } else {
        costume.availableQuantity += returnQty;
        costume.condition = returnDto.conditionAtReturn as any;
        if (costume.availableQuantity > 0) {
          costume.status = 'Available';
        }
      }

      if (session) {
        await costume.save({ session });
      } else {
        await costume.save();
      }

      await this.auditLogsService.log(
        userId,
        'COSTUME_RETURNED',
        targetAssignment._id.toString(),
        'CostumeAssignment',
        'Assigned',
        JSON.stringify({
          costumeId: costume._id,
          returnedQuantity: returnQty,
          conditionAtReturn: returnDto.conditionAtReturn,
        }),
        session || undefined,
      );

      if (session) {
        await session.commitTransaction();
      }
      return targetAssignment;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }
}

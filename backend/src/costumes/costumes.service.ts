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
import { CreateCostumeDto } from './dto/create-costume.dto';
import { UpdateCostumeDto } from './dto/update-costume.dto';
import { AssignCostumeDto } from './dto/assign-costume.dto';
import { ReturnCostumeDto } from './dto/return-costume.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getTransactionSession } from '../common/utils/transaction.util';
import { CostumeInventoryService } from './services/costume-inventory.service';

@Injectable()
export class CostumesService {
  constructor(
    @InjectModel(Costume.name) private readonly costumeModel: Model<CostumeDocument>,
    @InjectModel(CostumeAssignment.name) private readonly assignmentModel: Model<CostumeAssignmentDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
    private readonly costumeInventoryService: CostumeInventoryService,
  ) {}

  async create(productionId: string, createDto: CreateCostumeDto, userId: string): Promise<Costume> {
    const session = await getTransactionSession(this.connection);
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
        'COSTUMES',
        { productionId },
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
    const session = await getTransactionSession(this.connection);
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
        'COSTUMES',
        { productionId },
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
    const session = await getTransactionSession(this.connection);
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
        'COSTUMES',
        { productionId },
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
    return this.costumeInventoryService.assign(productionId, costumeId, assignDto, userId);
  }

  async return(
    productionId: string,
    assignmentId: string,
    returnDto: ReturnCostumeDto,
    userId: string,
  ): Promise<CostumeAssignment> {
    return this.costumeInventoryService.return(productionId, assignmentId, returnDto, userId);
  }
}

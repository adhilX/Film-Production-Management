import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Costume, CostumeDocument } from '../schemas/costume.schema';
import { CostumeAssignment, CostumeAssignmentDocument } from '../schemas/costume-assignment.schema';
import { Character, CharacterDocument } from '../../productions/schemas/character.schema';
import { CastCrew, CastCrewDocument } from '../../productions/schemas/cast-crew.schema';
import { AssignCostumeDto } from '../dto/assign-costume.dto';
import { ReturnCostumeDto } from '../dto/return-costume.dto';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { getTransactionSession } from '../../common/utils/transaction.util';

@Injectable()
export class CostumeInventoryService {
  constructor(
    @InjectModel(Costume.name) private readonly costumeModel: Model<CostumeDocument>,
    @InjectModel(CostumeAssignment.name) private readonly assignmentModel: Model<CostumeAssignmentDocument>,
    @InjectModel(Character.name) private readonly characterModel: Model<CharacterDocument>,
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async assign(
    productionId: string,
    costumeId: string,
    assignDto: AssignCostumeDto,
    userId: string,
  ): Promise<CostumeAssignment> {
    // XOR checks
    const { characterId, userId: targetUserId, quantity } = assignDto;
    if ((characterId && targetUserId) || (!characterId && !targetUserId)) {
      throw new BadRequestException('Exactly one of characterId or userId must be provided');
    }

    const session = await getTransactionSession(this.connection);
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
        'COSTUMES',
        { productionId },
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
    const session = await getTransactionSession(this.connection);
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
        'COSTUMES',
        { productionId },
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

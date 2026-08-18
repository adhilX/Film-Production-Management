import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import {
  FundRequest,
  FundRequestDocument,
} from './schemas/fund-request.schema';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Production, ProductionDocument } from '../productions/schemas/production.schema';
import { CastCrew, CastCrewDocument } from '../productions/schemas/cast-crew.schema';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundRequestDto } from './dto/update-fund-request.dto';
import { ApproveFundRequestDto } from './dto/approve-fund-request.dto';
import { RejectFundRequestDto } from './dto/reject-fund-request.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getTransactionSession } from '../common/utils/transaction.util';
import { FundApprovalService } from './services/fund-approval.service';

import { BudgetService } from './services/budget.service';

@Injectable()
export class FundsService implements OnModuleInit {
  constructor(
    @InjectModel(FundRequest.name)
    private fundRequestModel: Model<FundRequestDocument>,
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>,
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectModel(CastCrew.name)
    private castCrewModel: Model<CastCrewDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
    private readonly fundApprovalService: FundApprovalService,
    private readonly budgetService: BudgetService,
  ) {}

  /**
   * Safe, idempotent database migration for existing FundRequest data.
   */
  async onModuleInit() {
    try {
      const rawCollection = this.fundRequestModel.collection;
      const cursor = rawCollection.find({
        $or: [
          { amount: { $exists: true } },
          { justification: { $exists: true } },
          { approvedBy: { $exists: true } },
        ],
      });

      let migratedCount = 0;
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (!doc) continue;

        const updateData: any = {};
        const unsetFields: any = {};

        if (doc.amount !== undefined) {
          // Convert from main currency to paise/cents by multiplying by 100
          updateData.requestedAmount = Math.round(doc.amount * 100);
          unsetFields.amount = '';
        }

        if (doc.justification !== undefined) {
          updateData.description = doc.justification;
          unsetFields.justification = '';
        }

        if (doc.approvedBy !== undefined) {
          updateData.reviewedBy = doc.approvedBy;
          unsetFields.approvedBy = '';
        }

        if (doc.status === 'Approved' && doc.amount !== undefined) {
          updateData.approvedAmount = Math.round(doc.amount * 100);
          updateData.reviewedAt = doc.updatedAt || new Date();
        }

        if (doc.title === undefined) {
          updateData.title = 'Legacy Fund Request';
        }

        if (doc.category === undefined) {
          updateData.category = 'Legacy';
        }

        await rawCollection.updateOne(
          { _id: doc._id },
          {
            $set: updateData,
            $unset: unsetFields,
          },
        );
        migratedCount++;
      }

      if (migratedCount > 0) {
        console.log(
          `[Migration] Safely migrated ${migratedCount} legacy FundRequest documents to new schema.`,
        );
      }
    } catch (error) {
      console.error(
        '[Migration] Error migrating legacy FundRequest data:',
        error,
      );
    }
  }



  async getOrCreateBudget(
    productionId: string,
    userId: string,
    session?: ClientSession | null,
  ): Promise<BudgetDocument> {
    return this.budgetService.getOrCreateBudget(productionId, userId, session);
  }

  async updateBudget(
    productionId: string,
    updateDto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetDocument> {
    return this.budgetService.updateBudget(productionId, updateDto, userId);
  }

  /**
   * Creates a pending fund request.
   */
  async create(
    productionId: string,
    createDto: CreateFundRequestDto,
    requestedBy: string,
  ): Promise<FundRequestDocument> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }

    // Verify requester is assigned to this project
    const isAssigned = await this.castCrewModel
      .findOne({
        userId: new Types.ObjectId(requestedBy),
        productionId: new Types.ObjectId(productionId),
      })
      .exec();

    if (!isAssigned) {
      throw new ForbiddenException(
        'You are not assigned to this project and cannot request funds.',
      );
    }

    const request = new this.fundRequestModel({
      productionId: new Types.ObjectId(productionId),
      requestedBy: new Types.ObjectId(requestedBy),
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      requestedAmount: createDto.requestedAmount,
      approvedAmount: 0,
      status: 'Pending',
    });

    await request.save();

    await this.auditLogsService.log(
      requestedBy,
      'FUND_REQUEST_CREATED',
      request._id.toString(),
      'FundRequest',
      '',
      'Pending',
      undefined,
      'FUNDS',
      {
        productionId,
        requestedAmount: request.requestedAmount,
        title: request.title,
      },
    );

    return request;
  }

  /**
   * Finds all requests for the production.
   */
  async findAll(productionId: string): Promise<FundRequestDocument[]> {
    if (!Types.ObjectId.isValid(productionId)) {
      return [];
    }
    return this.fundRequestModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('requestedBy', 'email name')
      .populate('reviewedBy', 'email name')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Finds a single request.
   */
  async findOne(productionId: string, id: string): Promise<FundRequestDocument> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Fund request not found.');
    }
    const request = await this.fundRequestModel
      .findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      })
      .populate('requestedBy', 'email name')
      .populate('reviewedBy', 'email name')
      .exec();

    if (!request) {
      throw new NotFoundException('Fund request not found.');
    }
    return request;
  }

  /**
   * Updates a pending request.
   */
  async update(
    productionId: string,
    id: string,
    updateDto: UpdateFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    const request = await this.findOne(productionId, id);

    if (request.status !== 'Pending') {
      throw new BadRequestException('Only Pending requests can be modified.');
    }

    const previousState = JSON.stringify({
      title: request.title,
      description: request.description,
      category: request.category,
      requestedAmount: request.requestedAmount,
    });

    if (updateDto.title !== undefined) request.title = updateDto.title;
    if (updateDto.description !== undefined) request.description = updateDto.description;
    if (updateDto.category !== undefined) request.category = updateDto.category;
    if (updateDto.requestedAmount !== undefined) request.requestedAmount = updateDto.requestedAmount;

    await request.save();

    await this.auditLogsService.log(
      userId,
      'FUND_REQUEST_UPDATED',
      request._id.toString(),
      'FundRequest',
      previousState,
      JSON.stringify({
        title: request.title,
        description: request.description,
        category: request.category,
        requestedAmount: request.requestedAmount,
      }),
      undefined,
      'FUNDS',
      { productionId },
    );

    return request;
  }

  async approve(
    productionId: string,
    id: string,
    approveDto: ApproveFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    return this.fundApprovalService.approve(productionId, id, approveDto, userId);
  }

  async reject(
    productionId: string,
    id: string,
    rejectDto: RejectFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    return this.fundApprovalService.reject(productionId, id, rejectDto, userId);
  }

  async cancel(
    productionId: string,
    id: string,
    userId: string,
    userPermissions: string[],
    isSuperAdmin: boolean,
  ): Promise<FundRequestDocument> {
    return this.fundApprovalService.cancel(productionId, id, userId, userPermissions, isSuperAdmin);
  }
}

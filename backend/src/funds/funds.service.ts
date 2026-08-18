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

  /**
   * Helper to retrieve a transaction session if running in a replica set environment.
   * Otherwise returns null to bypass transactions.
   */
  private async getSession(): Promise<ClientSession | null> {
    try {
      const connAny = this.connection as any;
      const isReplica =
        connAny.client?.topology?.description?.type?.includes('ReplicaSet') ||
        Array.from(
          connAny.client?.topology?.description?.servers?.values() || [],
        ).some((server: any) => server.type?.includes('ReplicaSet'));
      if (isReplica) {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
      }
    } catch (e) {
      // Fallback to standalone MongoDB
    }
    return null;
  }

  /**
   * Retrieves or initializes the project budget.
   */
  async getOrCreateBudget(
    productionId: string,
    userId: string,
    session?: ClientSession | null,
  ): Promise<BudgetDocument> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }

    const budgetQuery = this.budgetModel.findOne({
      productionId: new Types.ObjectId(productionId),
    });
    let budget = session
      ? await budgetQuery.session(session).exec()
      : await budgetQuery.exec();

    if (!budget) {
      const prodQuery = this.productionModel.findById(productionId);
      const prod = session
        ? await prodQuery.session(session).exec()
        : await prodQuery.exec();

      if (!prod) {
        throw new NotFoundException(
          `Production with ID ${productionId} not found.`,
        );
      }

      // Convert initial project budget from main units to paise/cents
      const initialBudget = Math.round(prod.budget * 100);

      budget = new this.budgetModel({
        productionId: new Types.ObjectId(productionId),
        totalBudget: initialBudget,
        allocatedAmount: 0,
        remainingAmount: initialBudget,
        currency: 'INR',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      if (session) {
        await budget.save({ session });
      } else {
        await budget.save();
      }
    }
    return budget;
  }

  /**
   * Updates the project budget.
   */
  async updateBudget(
    productionId: string,
    updateDto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetDocument> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }

    const session = await this.getSession();
    try {
      const budget = await this.getOrCreateBudget(productionId, userId, session);

      if (updateDto.totalBudget < budget.allocatedAmount) {
        throw new BadRequestException(
          'Total budget cannot be less than already allocated amount.',
        );
      }

      const previousBudget = budget.totalBudget;
      budget.totalBudget = updateDto.totalBudget;
      budget.remainingAmount = budget.totalBudget - budget.allocatedAmount;
      budget.updatedBy = new Types.ObjectId(userId);
      if (updateDto.currency) {
        budget.currency = updateDto.currency;
      }

      if (session) {
        await budget.save({ session });
      } else {
        await budget.save();
      }

      // Write Audit Log
      await this.auditLogsService.log(
        userId,
        'BUDGET_UPDATED',
        budget._id.toString(),
        'Budget',
        JSON.stringify({ totalBudget: previousBudget }),
        JSON.stringify({ totalBudget: budget.totalBudget }),
        session || undefined,
        'FUNDS',
        { productionId },
      );

      if (session) {
        await session.commitTransaction();
      }
      return budget;
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
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

  /**
   * Approves a request with transaction/session protection.
   */
  async approve(
    productionId: string,
    id: string,
    approveDto: ApproveFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    const session = await this.getSession();
    try {
      const requestQuery = this.fundRequestModel.findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      });
      const request = session
        ? await requestQuery.session(session).exec()
        : await requestQuery.exec();

      if (!request) {
        throw new NotFoundException('Fund request not found.');
      }

      if (request.status !== 'Pending') {
        throw new BadRequestException('Only Pending requests can be approved.');
      }

      if (request.requestedBy.toString() === userId.toString()) {
        throw new BadRequestException(
          'Approvers cannot approve their own fund requests.',
        );
      }

      if (approveDto.approvedAmount <= 0) {
        throw new BadRequestException('Approved amount must be greater than zero.');
      }

      if (approveDto.approvedAmount > request.requestedAmount) {
        throw new BadRequestException(
          'Approved amount cannot exceed the requested amount.',
        );
      }

      // Load budget
      const budget = await this.getOrCreateBudget(productionId, userId, session);

      // Concurrency check: check if we have enough budget remaining
      if (approveDto.approvedAmount > budget.remainingAmount) {
        throw new ConflictException('Insufficient remaining project budget.');
      }

      // Update budget allocation
      budget.allocatedAmount = budget.allocatedAmount + approveDto.approvedAmount;
      budget.remainingAmount = budget.totalBudget - budget.allocatedAmount;
      budget.updatedBy = new Types.ObjectId(userId);

      if (session) {
        await budget.save({ session });
      } else {
        await budget.save();
      }

      // Update request status
      const previousStatus = request.status;
      request.status = 'Approved';
      request.approvedAmount = approveDto.approvedAmount;
      request.reviewedBy = new Types.ObjectId(userId);
      request.reviewedAt = new Date();

      if (session) {
        await request.save({ session });
      } else {
        await request.save();
      }

      // Log audit
      await this.auditLogsService.log(
        userId,
        'FUND_REQUEST_APPROVED',
        request._id.toString(),
        'FundRequest',
        previousStatus,
        'Approved',
        session || undefined,
        'FUNDS',
        {
          productionId,
          requestedAmount: request.requestedAmount,
          approvedAmount: request.approvedAmount,
        },
      );

      if (session) {
        await session.commitTransaction();
      }
      return this.findOne(productionId, id);
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Rejects a request with reason.
   */
  async reject(
    productionId: string,
    id: string,
    rejectDto: RejectFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    const request = await this.findOne(productionId, id);

    if (request.status !== 'Pending') {
      throw new BadRequestException('Only Pending requests can be rejected.');
    }

    if (!rejectDto.rejectionReason || rejectDto.rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const previousStatus = request.status;
    request.status = 'Rejected';
    request.rejectionReason = rejectDto.rejectionReason;
    request.reviewedBy = new Types.ObjectId(userId);
    request.reviewedAt = new Date();

    await request.save();

    await this.auditLogsService.log(
      userId,
      'FUND_REQUEST_REJECTED',
      request._id.toString(),
      'FundRequest',
      previousStatus,
      'Rejected',
      undefined,
      'FUNDS',
      {
        productionId,
        rejectionReason: request.rejectionReason,
      },
    );

    return request;
  }

  /**
   * Cancels a request.
   */
  async cancel(
    productionId: string,
    id: string,
    userId: string,
    userPermissions: string[],
    isSuperAdmin: boolean,
  ): Promise<FundRequestDocument> {
    const request = await this.findOne(productionId, id);

    if (request.status !== 'Pending') {
      throw new BadRequestException('Only Pending requests can be cancelled.');
    }

    // Check cancellation permission: must be requester OR admin/manager with funds.update
    const isRequester = request.requestedBy._id.toString() === userId.toString();
    const canCancel =
      isRequester || isSuperAdmin || userPermissions.includes('funds.update');

    if (!canCancel) {
      throw new ForbiddenException(
        'You do not have permission to cancel this request.',
      );
    }

    const previousStatus = request.status;
    request.status = 'Cancelled';
    request.reviewedBy = new Types.ObjectId(userId);
    request.reviewedAt = new Date();

    await request.save();

    await this.auditLogsService.log(
      userId,
      'FUND_REQUEST_CANCELLED',
      request._id.toString(),
      'FundRequest',
      previousStatus,
      'Cancelled',
      undefined,
      'FUNDS',
      { productionId },
    );

    return request;
  }
}

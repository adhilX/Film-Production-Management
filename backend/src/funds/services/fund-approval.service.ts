import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import { FundRequest, FundRequestDocument } from '../schemas/fund-request.schema';
import { Budget, BudgetDocument } from '../schemas/budget.schema';
import { Production, ProductionDocument } from '../../productions/schemas/production.schema';
import { ApproveFundRequestDto } from '../dto/approve-fund-request.dto';
import { RejectFundRequestDto } from '../dto/reject-fund-request.dto';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { getTransactionSession } from '../../common/utils/transaction.util';

@Injectable()
export class FundApprovalService {
  constructor(
    @InjectModel(FundRequest.name)
    private fundRequestModel: Model<FundRequestDocument>,
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>,
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async findOne(productionId: string, id: string, session?: ClientSession): Promise<FundRequestDocument> {
    if (!Types.ObjectId.isValid(productionId) || !Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Fund request not found.');
    }
    const query = this.fundRequestModel.findOne({
      _id: new Types.ObjectId(id),
      productionId: new Types.ObjectId(productionId),
    }).populate('requestedBy', 'email name').populate('reviewedBy', 'email name');

    const request = session ? await query.session(session).exec() : await query.exec();

    if (!request) {
      throw new NotFoundException('Fund request not found.');
    }
    return request;
  }

  private async getOrCreateBudget(
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

  async approve(
    productionId: string,
    id: string,
    approveDto: ApproveFundRequestDto,
    userId: string,
  ): Promise<FundRequestDocument> {
    const session = await getTransactionSession(this.connection);
    try {
      const request = await this.findOne(productionId, id, session || undefined);

      if (request.status !== 'Pending') {
        throw new BadRequestException('Only Pending requests can be approved.');
      }

      if (request.requestedBy._id.toString() === userId.toString()) {
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

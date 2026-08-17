import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { FundRequest, FundRequestDocument } from './schemas/fund-request.schema';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundStatusDto } from './dto/update-fund-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FundsService {
  constructor(
    @InjectModel(FundRequest.name) private fundRequestModel: Model<FundRequestDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    productionId: string,
    createDto: CreateFundRequestDto,
    requestedBy: string,
  ): Promise<FundRequest> {
    const fund = new this.fundRequestModel({
      productionId: new Types.ObjectId(productionId),
      requestedBy: new Types.ObjectId(requestedBy),
      amount: createDto.amount,
      justification: createDto.justification,
      status: 'Pending',
    });
    await fund.save();

    await this.auditLogsService.log(
      requestedBy,
      'FUND_CREATED',
      (fund._id as any).toString(),
      'FundRequest',
      '',
      'Pending',
      undefined,
      'FUNDS',
      { amount: fund.amount, justification: fund.justification }
    );

    return fund;
  }

  async findAll(productionId: string): Promise<FundRequest[]> {
    return this.fundRequestModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('requestedBy', 'email name')
      .exec();
  }

  async findOne(id: string): Promise<FundRequest> {
    const fund = await this.fundRequestModel.findById(id).exec();
    if (!fund) {
      throw new NotFoundException('Fund request not found');
    }
    return fund;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateFundStatusDto,
    userId: string,
  ): Promise<FundRequest> {
    const { status: nextStatus, rejectionReason } = updateDto;
    const fund = await this.fundRequestModel.findById(id).exec();
    if (!fund) {
      throw new NotFoundException('Fund request not found');
    }

    const previousStatus = fund.status;
    if (previousStatus === nextStatus) {
      return fund;
    }

    if (nextStatus === 'Rejected' && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting a fund request');
    }

    // Try Mongoose Transaction
    let session: any = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();
    } catch (e) {
      // Standalone MongoDB fallback
      session = null;
    }

    try {
      fund.status = nextStatus;
      if (nextStatus === 'Approved') {
        fund.approvedBy = new Types.ObjectId(userId);
      }
      
      const action = nextStatus === 'Approved' ? 'FUND_APPROVED' : nextStatus === 'Rejected' ? 'FUND_REJECTED' : 'FUND_STATUS_CHANGE';
      const metadata = {
        requestId: fund._id.toString(),
        amount: fund.amount,
        ...(rejectionReason && { rejectionReason })
      };

      if (session) {
        await fund.save({ session });
        await this.auditLogsService.log(
          userId,
          action,
          (fund._id as any).toString(),
          'FundRequest',
          previousStatus,
          nextStatus,
          session,
          'FUNDS',
          metadata,
        );
        await session.commitTransaction();
      } else {
        await fund.save();
        await this.auditLogsService.log(
          userId,
          action,
          (fund._id as any).toString(),
          'FundRequest',
          previousStatus,
          nextStatus,
          undefined,
          'FUNDS',
          metadata,
        );
      }
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

    return this.findOne(id);
  }
}

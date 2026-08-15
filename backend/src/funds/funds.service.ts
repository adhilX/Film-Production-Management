import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { status: nextStatus } = updateDto;
    const fund = await this.fundRequestModel.findById(id).exec();
    if (!fund) {
      throw new NotFoundException('Fund request not found');
    }

    const previousStatus = fund.status;
    if (previousStatus === nextStatus) {
      return fund;
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
      if (session) {
        await fund.save({ session });
        await this.auditLogsService.log(
          userId,
          'FUND_STATUS_CHANGE',
          (fund._id as any).toString(),
          'FundRequest',
          previousStatus,
          nextStatus,
          session,
        );
        await session.commitTransaction();
      } else {
        await fund.save();
        await this.auditLogsService.log(
          userId,
          'FUND_STATUS_CHANGE',
          (fund._id as any).toString(),
          'FundRequest',
          previousStatus,
          nextStatus,
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

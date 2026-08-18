import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async log(
    userId: string,
    action: string,
    resourceId: string,
    resourceType: string,
    previousState: string,
    newState: string,
    session?: ClientSession,
    module?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    productionId?: string | Types.ObjectId,
  ): Promise<AuditLog> {
    const logEntryData: any = {
      userId: new Types.ObjectId(userId),
      action,
      resourceId: new Types.ObjectId(resourceId),
      resourceType,
      previousState,
      newState,
      module,
      metadata,
      ipAddress,
      timestamp: new Date(),
    };

    if (productionId && Types.ObjectId.isValid(productionId.toString())) {
      logEntryData.productionId = new Types.ObjectId(productionId.toString());
    }

    const logEntry = new this.auditLogModel(logEntryData);

    if (session) {
      return (await logEntry.save({ session })) as any;
    } else {
      return (await logEntry.save()) as any;
    }
  }

  async create(
    actorId: string,
    targetId: string,
    action: string,
    metadata: { oldStatus?: string; newStatus?: string; productionId?: string | Types.ObjectId; [key: string]: any },
    module?: string,
    ipAddress?: string,
    session?: ClientSession,
    productionId?: string | Types.ObjectId,
  ): Promise<AuditLog> {
    const finalProdId = productionId || metadata?.productionId;
    return this.log(
      actorId,
      action,
      targetId,
      'User',
      metadata?.oldStatus || '',
      metadata?.newStatus || '',
      session,
      module,
      metadata,
      ipAddress,
      finalProdId,
    );
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogModel
      .find()
      .populate('userId', 'email name')
      .sort({ timestamp: -1 })
      .exec();
  }

  async findAllPaginated(query: {
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
    action?: string;
    productionId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    allowedProductionIds?: Types.ObjectId[];
  }): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    pages: number;
    limit: number;
    metrics: {
      total: number;
      securityEvents: number;
      configChanges: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 1. Scoping rule: restrict Production Admins to their assigned productions OR global logs
    if (query.allowedProductionIds) {
      filter.$or = [
        { productionId: { $in: query.allowedProductionIds } },
        { productionId: { $exists: false } },
        { productionId: null },
      ];
    }

    // 2. Explicit productionId filter (if present)
    if (query.productionId && Types.ObjectId.isValid(query.productionId)) {
      const prodIdObj = new Types.ObjectId(query.productionId);
      if (query.allowedProductionIds) {
        const isAllowed = query.allowedProductionIds.some((id) =>
          id.equals(prodIdObj),
        );
        if (isAllowed) {
          filter.productionId = prodIdObj;
          delete filter.$or;
        } else {
          // Force no match if trying to fetch unauthorized production
          filter.productionId = new Types.ObjectId();
          delete filter.$or;
        }
      } else {
        filter.productionId = prodIdObj;
      }
    }

    // 3. Module & Action filter
    if (query.module && query.module !== 'All') {
      filter.module = query.module;
    }
    if (query.action && query.action !== 'All') {
      filter.action = query.action;
    }

    // 4. Search Filter
    if (query.search && query.search.trim()) {
      const cleanSearch = query.search.trim();
      const searchRegex = new RegExp(
        cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      // Search matching users first
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
          ],
        })
        .select('_id')
        .exec();
      const userIds = matchingUsers.map((u) => u._id);

      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { action: { $regex: searchRegex } },
            { module: { $regex: searchRegex } },
            { resourceType: { $regex: searchRegex } },
            { ipAddress: { $regex: searchRegex } },
            { userId: { $in: userIds } },
          ],
        },
      ];
    }

    // 5. Sorting
    const sortField = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = {};
    if (
      ['timestamp', 'action', 'module', 'resourceType', 'ipAddress'].includes(
        sortField,
      )
    ) {
      sortObj[sortField] = sortOrder;
    } else {
      sortObj.timestamp = -1;
    }

    const total = await this.auditLogModel.countDocuments(filter).exec();
    const pages = Math.ceil(total / limit) || 1;

    // Calculate dynamic KPI metrics on the same filtered scope
    const securityFilter = {
      ...filter,
      action: { $regex: /SECURITY|DENIAL|REJECT|FAIL/i },
    };
    const securityEvents = await this.auditLogModel.countDocuments(securityFilter).exec();

    const configFilter = {
      ...filter,
      action: { $regex: /CREATE|UPDATE|DELETE|CHANGE/i },
    };
    const configChanges = await this.auditLogModel.countDocuments(configFilter).exec();

    const logs = await this.auditLogModel
      .find(filter)
      .populate('userId', 'email name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      logs,
      total,
      page,
      pages,
      limit,
      metrics: {
        total,
        securityEvents,
        configChanges,
      },
    };
  }
}


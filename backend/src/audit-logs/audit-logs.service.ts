import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
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
  ): Promise<AuditLog> {
    const logEntry = new this.auditLogModel({
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
    });

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
    metadata: { oldStatus?: string; newStatus?: string; [key: string]: any },
    module?: string,
    ipAddress?: string,
    session?: ClientSession,
  ): Promise<AuditLog> {
    return this.log(
      actorId,
      action,
      targetId,
      'User',
      metadata.oldStatus || '',
      metadata.newStatus || '',
      session,
      module,
      metadata,
      ipAddress,
    );
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogModel
      .find()
      .populate('userId', 'email name')
      .sort({ timestamp: -1 })
      .exec();
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ type: Types.ObjectId, required: true })
  resourceId: Types.ObjectId;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ index: true })
  module: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  previousState: string;

  @Prop()
  newState: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'Production', required: false, index: true })
  productionId?: Types.ObjectId;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Add compound index for project-specific sorting
AuditLogSchema.index({ productionId: 1, timestamp: -1 });


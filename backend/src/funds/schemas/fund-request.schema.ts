import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FundRequestDocument = FundRequest & Document;

@Schema({ timestamps: true })
export class FundRequest {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Number, required: true, min: 1 })
  requestedAmount: number; // Stored in smallest currency units (paise/cents)

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  approvedAmount: number; // Stored in smallest currency units (paise/cents)

  @Prop({
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  })
  status: string;

  @Prop({ type: String, default: null })
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date;
}

export const FundRequestSchema = SchemaFactory.createForClass(FundRequest);
FundRequestSchema.index({ productionId: 1, status: 1 });


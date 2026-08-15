import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FundRequestDocument = FundRequest & Document;

@Schema({ timestamps: true })
export class FundRequest {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  justification: string;

  @Prop({
    required: true,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;
}

export const FundRequestSchema = SchemaFactory.createForClass(FundRequest);

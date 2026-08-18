import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true, unique: true })
  productionId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  totalBudget: number; // Stored in smallest currency units (paise/cents)

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  allocatedAmount: number; // Stored in smallest currency units (paise/cents)

  @Prop({ type: Number, required: true, min: 0 })
  remainingAmount: number; // Stored in smallest currency units (paise/cents)

  @Prop({ type: String, required: true, default: 'INR' })
  currency: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

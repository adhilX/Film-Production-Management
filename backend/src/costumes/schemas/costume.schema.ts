import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CostumeCondition = 'New' | 'Good' | 'Fair' | 'Damaged';
export type CostumeStatus = 'Available' | 'Assigned' | 'Damaged' | 'Lost';

export type CostumeDocument = Costume & Document;

@Schema({ timestamps: true })
export class Costume {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  size?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  availableQuantity: number;

  @Prop({
    required: true,
    enum: ['New', 'Good', 'Fair', 'Damaged'],
    default: 'New',
  })
  condition: CostumeCondition;

  @Prop({
    required: true,
    enum: ['Available', 'Assigned', 'Damaged', 'Lost'],
    default: 'Available',
  })
  status: CostumeStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const CostumeSchema = SchemaFactory.createForClass(Costume);

// Add indexes for efficient querying
CostumeSchema.index({ productionId: 1 });
CostumeSchema.index({ productionId: 1, name: 1 }, { unique: true });
CostumeSchema.index({ status: 1 });
CostumeSchema.index({ category: 1 });

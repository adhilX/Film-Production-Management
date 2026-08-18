import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentStatus = 'Assigned' | 'Returned';

export type CostumeAssignmentDocument = CostumeAssignment & Document;

@Schema({ timestamps: true })
export class CostumeAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Costume', required: true })
  costumeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  characterId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId;

  @Prop({ type: Date, required: true, default: Date.now })
  assignedAt: Date;

  @Prop({ type: Date })
  returnedAt?: Date;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({
    required: true,
    enum: ['Assigned', 'Returned'],
    default: 'Assigned',
  })
  status: AssignmentStatus;

  @Prop({ required: true, enum: ['New', 'Good', 'Fair', 'Damaged'] })
  conditionAtAssignment: string;

  @Prop({ enum: ['New', 'Good', 'Fair', 'Damaged'] })
  conditionAtReturn?: string;

  @Prop({ trim: true })
  notes?: string;
}

export const CostumeAssignmentSchema = SchemaFactory.createForClass(CostumeAssignment);

// Indexes
CostumeAssignmentSchema.index({ productionId: 1 });
CostumeAssignmentSchema.index({ costumeId: 1 });
CostumeAssignmentSchema.index({ status: 1 });
CostumeAssignmentSchema.index({ assignedTo: 1 });
CostumeAssignmentSchema.index({ characterId: 1 });

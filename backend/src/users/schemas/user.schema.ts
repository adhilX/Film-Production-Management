import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    enum: ['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Production Company', 'None'],
    default: 'None',
  })
  contractorType: string;

  @Prop({
    required: true,
    enum: ['Admin', 'Manager', 'User'],
    default: 'User',
  })
  systemRole: string;

  @Prop({
    required: true,
    enum: ['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected', 'Changes Requested'],
    default: 'Draft',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: Types.ObjectId;

  @Prop({ required: true, default: false })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

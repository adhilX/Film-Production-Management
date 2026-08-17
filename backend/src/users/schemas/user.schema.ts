import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
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

  @Prop({ type: Types.ObjectId, ref: 'Role', default: null })
  roleId: Types.ObjectId | null;

  @Prop({ required: true, default: false })
  isActive: boolean;

  @Prop({
    required: true,
    enum: ['in-progress', 'pending-review', 'approved', 'changes-requested'],
    default: 'in-progress',
  })
  onboardingStatus: string;

  @Prop({ required: true, default: 1 })
  currentStep: number;

  @Prop({ required: false })
  adminFeedback?: string;

  // Virtual field
  profile?: any;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('profile', {
  ref: 'UserProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

UserSchema.virtual('permissions').get(function (this: UserDocument) {
  if (this.roleId && (this.roleId as any).permissions) {
    return (this.roleId as any).permissions.map((p: any) => p.name || p.toString());
  }
  return [];
});

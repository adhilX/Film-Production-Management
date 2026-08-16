import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProfileDocument = UserProfile & Document;

@Schema({ _id: false })
export class BankDetails {
  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  accountNumber: string;
}

const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);

@Schema({ timestamps: true })
export class UserProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Professional
  @Prop({ type: String })
  photoUrl?: string;

  @Prop({ type: String })
  department?: string;

  @Prop({ type: String })
  position?: string;

  @Prop({ type: [String], default: [] })
  experience: string[];

  // Contact
  @Prop({ type: String })
  phoneNumber?: string;

  @Prop({ type: String })
  secondaryEmail?: string;

  // Financial
  @Prop({ type: BankDetailsSchema })
  bankDetails?: BankDetails;

  @Prop({ type: String })
  taxFormUrl?: string;

  // Identity
  @Prop({ type: [String], default: [] })
  identityDocs: string[];
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProfileDocument = UserProfile & Document;

@Schema({ _id: false })
export class BankDetails {
  @Prop()
  bankName?: string;

  @Prop()
  accountNumber?: string;

  @Prop({ required: false })
  routingNumber?: string;
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
  @Prop({ type: String })
  governmentIdType?: string;

  @Prop({ type: [String], default: [] })
  identityDocs: string[];

  // Contracts
  @Prop({ type: Boolean, default: false })
  signedNda: boolean;

  @Prop({ type: Boolean, default: false })
  signedTerms: boolean;

  @Prop({ type: String })
  signatureData?: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

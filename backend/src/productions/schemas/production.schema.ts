import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductionDocument = Production & Document;

@Schema({ timestamps: true })
export class Production {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, default: 'Drama' })
  genre: string;

  @Prop({ required: true, default: 'English' })
  language: string;

  @Prop({ required: true, default: 'Feature Film' })
  format: string;

  @Prop({ default: '' })
  logline: string;

  @Prop({ default: '' })
  synopsis: string;

  @Prop({ type: Date, default: () => new Date() })
  startDate: Date;

  @Prop({ type: Date, default: () => new Date() })
  endDate: Date;

  @Prop({ type: Number, default: 0 })
  budget: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  productionManager: Types.ObjectId;

  @Prop({ type: String, default: null })
  imageUrl?: string;

  @Prop({ required: true, default: 'Draft' })
  status: string;
}

export const ProductionSchema = SchemaFactory.createForClass(Production);


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductionDocument = Production & Document;

@Schema({ timestamps: true })
export class Production {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, default: 'Pre-Production' })
  status: string;
}

export const ProductionSchema = SchemaFactory.createForClass(Production);

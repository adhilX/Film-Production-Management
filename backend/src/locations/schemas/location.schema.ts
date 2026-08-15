import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({
    required: true,
    enum: ['Requested', 'Under Review', 'Approved', 'Booked', 'Completed'],
    default: 'Requested',
  })
  status: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

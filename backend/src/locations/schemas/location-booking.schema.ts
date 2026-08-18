import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocationBookingDocument = LocationBooking & Document;

@Schema({ timestamps: true })
export class LocationBooking {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  })
  status: string;

  @Prop()
  rejectionReason?: string;
}

export const LocationBookingSchema = SchemaFactory.createForClass(LocationBooking);

// Add index on productionId, locationId, status, and dates for queries and collision checks
LocationBookingSchema.index({ productionId: 1 });
LocationBookingSchema.index({ locationId: 1, status: 1, startDate: 1, endDate: 1 });
LocationBookingSchema.index({ requestedBy: 1 });
LocationBookingSchema.index({ productionId: 1, startDate: 1 });


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CastCrewDocument = CastCrew & Document;

@Schema({ timestamps: true })
export class CastCrew {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ required: true })
  roleInProduction: string;

  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  characterId: Types.ObjectId;
}

export const CastCrewSchema = SchemaFactory.createForClass(CastCrew);

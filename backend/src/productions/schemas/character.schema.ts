import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CharacterDocument = Character & Document;

@Schema({ timestamps: true })
export class Character {
  @Prop({ type: Types.ObjectId, ref: 'Production', required: true })
  productionId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignments: Types.ObjectId[];
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

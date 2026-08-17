import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, default: 'Custom Perms' })
  group: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

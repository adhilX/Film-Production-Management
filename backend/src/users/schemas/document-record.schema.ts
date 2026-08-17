import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentRecordDocument = DocumentRecord & Document;

@Schema({ timestamps: true })
export class DocumentRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['photo', 'taxForm', 'identityDoc', 'nda'],
  })
  documentType: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;
}

export const DocumentRecordSchema =
  SchemaFactory.createForClass(DocumentRecord);

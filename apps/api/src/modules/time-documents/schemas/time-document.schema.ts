import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DocumentStatus } from '@pontovision/shared';

export type TimeDocumentDocument = TimeDocument & Document;

@Schema({ timestamps: true })
export class TimeDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  originalFilename: string;

  @Prop({ required: true })
  fileStorageKey: string;

  @Prop()
  processedStorageKey?: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop()
  processedFileSize?: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.UPLOADED })
  status: DocumentStatus;

  @Prop({ type: Types.ObjectId, ref: 'OcrResult', default: null })
  ocrResultId?: Types.ObjectId;
}

export const TimeDocumentSchema = SchemaFactory.createForClass(TimeDocument);
TimeDocumentSchema.index({ userId: 1, createdAt: -1 });

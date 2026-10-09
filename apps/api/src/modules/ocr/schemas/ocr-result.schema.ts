import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OcrResultDocument = OcrResult & Document;

@Schema({ timestamps: true })
export class OcrResult {
  @Prop({ type: Types.ObjectId, ref: 'TimeDocument', required: true, index: true })
  documentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'Tesseract.js' })
  engine: string;

  @Prop({ default: '5.x' })
  engineVersion: string;

  @Prop({ required: true, default: 'por' })
  language: string;

  @Prop({ required: true })
  rawText: string;

  @Prop({ type: Object, required: true })
  extractedFields: {
    name?: string;
    cpf?: string;
    nsr?: string;
    date?: string;
    time?: string;
    rawLines?: string[];
  };

  @Prop({ type: Object, required: true })
  fieldConfidence: {
    name?: number;
    cpf?: number;
    nsr?: number;
    date?: number;
    time?: number;
    overall: number;
  };

  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop({ required: true, default: false })
  reviewRequired: boolean;

  @Prop({ required: true, enum: ['PENDING', 'ACCEPTED', 'EDITED', 'REJECTED'], default: 'PENDING' })
  reviewStatus: string;

  @Prop({ default: Date.now })
  processedAt: Date;
}

export const OcrResultSchema = SchemaFactory.createForClass(OcrResult);
OcrResultSchema.index({ documentId: 1 });
OcrResultSchema.index({ userId: 1, createdAt: -1 });

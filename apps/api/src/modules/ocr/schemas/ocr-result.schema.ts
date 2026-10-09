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
    // Dados do trabalhador
    name?: string;
    cpf?: string;
    nsr?: string;
    date?: string;
    time?: string;
    // Dados da empresa / REP
    razaoSocial?: string;
    cnpj?: string;
    cei?: string;
    local?: string;
    nrep?: string;
    modeloRep?: string;
    // Assinatura digital
    assinaturaDigital?: string;
    rawLines?: string[];
  };

  @Prop({ type: Object, default: {} })
  editedFields: {
    name?: string;
    cpf?: string;
    nsr?: string;
    date?: string;
    time?: string;
    razaoSocial?: string;
    cnpj?: string;
    cei?: string;
    local?: string;
    nrep?: string;
    modeloRep?: string;
    assinaturaDigital?: string;
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

  @Prop()
  thumbnailStorageKey?: string;

  @Prop({ type: Object })
  imageStats?: {
    originalSize: number;
    processedSize: number;
    thumbSize?: number;
    mimeType?: string;
  };

  @Prop({ default: Date.now })
  processedAt: Date;
}

export const OcrResultSchema = SchemaFactory.createForClass(OcrResult);
OcrResultSchema.index({ documentId: 1 });
OcrResultSchema.index({ userId: 1, createdAt: -1 });

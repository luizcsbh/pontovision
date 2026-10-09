import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OcrResult, OcrResultDocument } from './schemas/ocr-result.schema';
import { TimeDocument, TimeDocumentDocument } from '../time-documents/schemas/time-document.schema';
import { LocalOcrService } from './local-ocr.service';
import { FILE_STORAGE_PROVIDER } from '../storage/storage.module';
import { IFileStorageProvider } from '../storage/storage.interface';
import { IMAGE_PROCESSOR } from '../image-processing/image-processing.module';
import { IImageProcessor } from '../image-processing/image-processing.interface';
import { DocumentStatus } from '@pontovision/shared';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @InjectModel(OcrResult.name) private readonly ocrResultModel: Model<OcrResultDocument>,
    @InjectModel(TimeDocument.name) private readonly documentModel: Model<TimeDocumentDocument>,
    private readonly localOcrService: LocalOcrService,
    @Inject(FILE_STORAGE_PROVIDER) private readonly storageProvider: IFileStorageProvider,
    @Inject(IMAGE_PROCESSOR) private readonly imageProcessor: IImageProcessor,
  ) {}

  async processDocumentOcr(documentId: string, userId: string): Promise<OcrResultDocument> {
    const doc = await this.documentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
    });

    if (!doc) {
      throw new NotFoundException('Documento não encontrado.');
    }

    doc.status = DocumentStatus.PROCESSING;
    await doc.save();

    try {
      // 1. Carrega imagem original do storage
      const { buffer } = await this.storageProvider.getFile(doc.fileStorageKey);

      // 2. Pré-processa imagem com Sharp para contraste e nitidez
      const preprocessed = await this.imageProcessor.preprocessForOcr(buffer);

      // 3. Salva cópia processada no storage
      const processedSaved = await this.storageProvider.saveFile(
        preprocessed.buffer,
        `processed_${doc.originalFilename}`,
        preprocessed.mimeType,
        'processed',
      );

      doc.processedStorageKey = processedSaved.storageKey;
      doc.processedFileSize = preprocessed.size;

      // 4. Executa OCR local com Tesseract.js
      const ocrOutput = await this.localOcrService.recognizeText(preprocessed.buffer);

      // 5. Salva resultado estruturado no MongoDB
      const ocrResult = await this.ocrResultModel.create({
        documentId: doc._id,
        userId: new Types.ObjectId(userId),
        engine: ocrOutput.engine,
        engineVersion: ocrOutput.engineVersion,
        language: 'por',
        rawText: ocrOutput.rawText,
        extractedFields: ocrOutput.extractedFields,
        fieldConfidence: ocrOutput.fieldConfidence,
        warnings: ocrOutput.warnings,
        reviewRequired: ocrOutput.reviewRequired,
        reviewStatus: 'PENDING',
        processedAt: new Date(),
      });

      doc.status = DocumentStatus.OCR_PROCESSED;
      doc.ocrResultId = ocrResult._id as Types.ObjectId;
      await doc.save();

      return ocrResult;
    } catch (err: any) {
      this.logger.error(`Erro ao processar OCR para documento ${documentId}: ${err.message}`, err.stack);
      doc.status = DocumentStatus.REJECTED;
      await doc.save();
      throw err;
    }
  }

  async getOcrResult(id: string, userId: string): Promise<OcrResultDocument> {
    const res = await this.ocrResultModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!res) throw new NotFoundException('Resultado de OCR não encontrado.');
    return res;
  }

  async getOcrByDocumentId(documentId: string, userId: string): Promise<OcrResultDocument | null> {
    return this.ocrResultModel.findOne({
      documentId: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
    });
  }
}

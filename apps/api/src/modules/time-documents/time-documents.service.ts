import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimeDocument, TimeDocumentDocument } from './schemas/time-document.schema';
import { FILE_STORAGE_PROVIDER } from '../storage/storage.module';
import { IFileStorageProvider } from '../storage/storage.interface';
import { IMAGE_PROCESSOR } from '../image-processing/image-processing.module';
import { IImageProcessor } from '../image-processing/image-processing.interface';
import { DocumentStatus } from '@pontovision/shared';

@Injectable()
export class TimeDocumentsService {
  private readonly logger = new Logger(TimeDocumentsService.name);

  constructor(
    @InjectModel(TimeDocument.name) private readonly documentModel: Model<TimeDocumentDocument>,
    @Inject(FILE_STORAGE_PROVIDER) private readonly storageProvider: IFileStorageProvider,
    @Inject(IMAGE_PROCESSOR) private readonly imageProcessor: IImageProcessor,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
  ): Promise<TimeDocumentDocument> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // Valida MIME Type seguro
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException(`Formato de arquivo não suportado: ${file.mimetype}. Use JPEG, PNG ou WEBP.`);
    }

    // Salva arquivo original
    const stored = await this.storageProvider.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'originals',
    );

    let width: number | undefined;
    let height: number | undefined;

    if (file.mimetype.startsWith('image/')) {
      try {
        const meta = await this.imageProcessor.getImageMetadata(file.buffer);
        width = meta.width;
        height = meta.height;
      } catch (err: any) {
        this.logger.warn(`Não foi possível ler dimensões da imagem: ${err.message}`);
      }
    }

    const doc = await this.documentModel.create({
      userId: new Types.ObjectId(userId),
      originalFilename: file.originalname,
      fileStorageKey: stored.storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      width,
      height,
      status: DocumentStatus.UPLOADED,
    });

    return doc;
  }

  async findUserDocuments(userId: string): Promise<TimeDocumentDocument[]> {
    return this.documentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDocumentById(documentId: string, userId: string): Promise<TimeDocumentDocument> {
    const doc = await this.documentModel.findOne({
      _id: new Types.ObjectId(documentId),
      userId: new Types.ObjectId(userId),
    });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado.');
    }
    return doc;
  }

  async getDocumentFile(documentId: string, userId: string, processed = false) {
    const doc = await this.getDocumentById(documentId, userId);
    const key = (processed && doc.processedStorageKey) ? doc.processedStorageKey : doc.fileStorageKey;
    return this.storageProvider.getFile(key);
  }

  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    const doc = await this.getDocumentById(documentId, userId);
    await this.storageProvider.deleteFile(doc.fileStorageKey);
    if (doc.processedStorageKey) {
      await this.storageProvider.deleteFile(doc.processedStorageKey);
    }
    await this.documentModel.deleteOne({ _id: doc._id });
    return true;
  }
}

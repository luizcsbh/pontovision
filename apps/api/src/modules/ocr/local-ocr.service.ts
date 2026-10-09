import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker, Worker } from 'tesseract.js';
import * as path from 'path';
import * as fs from 'fs';
import { IOcrProvider, IOcrRecognitionOutput } from './ocr.interface';
import { OcrParserService } from './ocr-parser.service';

@Injectable()
export class LocalOcrService implements IOcrProvider, OnModuleDestroy {
  private readonly logger = new Logger(LocalOcrService.name);
  private worker: Worker | null = null;
  private isInitializing = false;
  private readonly cachePath: string;
  private readonly defaultLang: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly parserService: OcrParserService,
  ) {
    this.defaultLang = this.configService.get<string>('OCR_LANGUAGE') || 'por';
    this.cachePath = path.resolve(
      this.configService.get<string>('OCR_CACHE_PATH') || './uploads/tesseract-cache'
    );

    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
  }

  private async getWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    if (this.isInitializing) {
      // Wait until worker is initialized
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.worker) return this.worker;
    }

    this.isInitializing = true;
    try {
      this.logger.log(`Inicializando Tesseract.js Worker localmente para idioma "${this.defaultLang}"...`);
      const worker = await createWorker(this.defaultLang, 1, {
        cachePath: this.cachePath,
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Optional progress logging
          }
        },
      });

      this.worker = worker;
      this.logger.log('Worker do Tesseract.js pronto para OCR local.');
      return this.worker;
    } catch (err: any) {
      this.logger.error(`Falha ao inicializar worker local Tesseract: ${err.message}`, err.stack);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  async recognizeText(imageBuffer: Buffer, language?: string): Promise<IOcrRecognitionOutput> {
    const lang = language || this.defaultLang;
    const worker = await this.getWorker();

    this.logger.log(`Executando OCR local em buffer de ${imageBuffer.length} bytes...`);
    const { data } = await worker.recognize(imageBuffer);

    const rawText = data.text || '';
    const confidence = typeof data.confidence === 'number' ? data.confidence : 70;

    // Repassa texto bruto e confiança para o parser especializado
    const parsed = this.parserService.parseText(rawText, confidence);

    return {
      rawText,
      extractedFields: parsed.extractedFields,
      fieldConfidence: parsed.fieldConfidence,
      warnings: parsed.warnings,
      reviewRequired: parsed.reviewRequired,
      engine: 'Tesseract.js',
      engineVersion: '5.x',
    };
  }

  async onModuleDestroy() {
    if (this.worker) {
      this.logger.log('Finalizando Worker do Tesseract.js...');
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

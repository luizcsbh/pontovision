import { Injectable, Logger } from '@nestjs/common';
import { IImageProcessor, IProcessedImageResult } from './image-processing.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp') as typeof import('sharp');

@Injectable()
export class SharpImageProcessorService implements IImageProcessor {
  private readonly logger = new Logger(SharpImageProcessorService.name);

  async getImageMetadata(buffer: Buffer): Promise<{ width?: number; height?: number; format?: string }> {
    const meta = await sharp(buffer).metadata();
    return {
      width: meta.width,
      height: meta.height,
      format: meta.format,
    };
  }

  async optimizeForDisplay(buffer: Buffer, maxWidth = 1920): Promise<IProcessedImageResult> {
    const pipeline = sharp(buffer)
      .rotate() // auto-orient by EXIF
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: 85, mozjpeg: true });

    const processedBuffer = await pipeline.toBuffer();
    const meta = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      width: meta.width || 0,
      height: meta.height || 0,
      size: processedBuffer.length,
      mimeType: 'image/jpeg',
    };
  }

  async preprocessForOcr(buffer: Buffer): Promise<IProcessedImageResult> {
    // Sharp pipeline calibrado para comprovantes/relógios REP de papel térmico:
    // 1. Auto-orientação via EXIF
    // 2. Resize para densidade adequada de OCR (~1800px)
    // 3. Escala de cinza
    // 4. Normalização de contraste
    // 5. Nitidez para contornos de texto
    const pipeline = sharp(buffer)
      .rotate()
      .resize({
        width: 1800,
        withoutEnlargement: false,
        fit: 'inside',
      })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.7 })
      .png();

    const ocrReadyBuffer = await pipeline.toBuffer();
    const meta = await sharp(ocrReadyBuffer).metadata();

    return {
      buffer: ocrReadyBuffer,
      width: meta.width || 0,
      height: meta.height || 0,
      size: ocrReadyBuffer.length,
      mimeType: 'image/png',
    };
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OcrResult, OcrResultSchema } from './schemas/ocr-result.schema';
import { TimeDocument, TimeDocumentSchema } from '../time-documents/schemas/time-document.schema';
import { OcrService } from './ocr.service';
import { LocalOcrService } from './local-ocr.service';
import { OcrParserService } from './ocr-parser.service';
import { OcrController } from './ocr.controller';
import { ImageProcessingModule } from '../image-processing/image-processing.module';

@Module({
  imports: [
    ConfigModule,
    ImageProcessingModule,
    MongooseModule.forFeature([
      { name: OcrResult.name, schema: OcrResultSchema },
      { name: TimeDocument.name, schema: TimeDocumentSchema },
    ]),
  ],
  controllers: [OcrController],
  providers: [OcrService, LocalOcrService, OcrParserService],
  exports: [OcrService, LocalOcrService, OcrParserService],
})
export class OcrModule {}

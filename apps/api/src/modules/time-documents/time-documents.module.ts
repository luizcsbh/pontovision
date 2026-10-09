import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeDocument, TimeDocumentSchema } from './schemas/time-document.schema';
import { TimeDocumentsService } from './time-documents.service';
import { TimeDocumentsController } from './time-documents.controller';
import { ImageProcessingModule } from '../image-processing/image-processing.module';

@Module({
  imports: [
    ImageProcessingModule,
    MongooseModule.forFeature([{ name: TimeDocument.name, schema: TimeDocumentSchema }]),
  ],
  controllers: [TimeDocumentsController],
  providers: [TimeDocumentsService],
  exports: [TimeDocumentsService],
})
export class TimeDocumentsModule {}

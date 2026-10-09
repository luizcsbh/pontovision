import { Module } from '@nestjs/common';
import { SharpImageProcessorService } from './sharp-image-processor.service';

export const IMAGE_PROCESSOR = 'IMAGE_PROCESSOR';

@Module({
  providers: [
    {
      provide: IMAGE_PROCESSOR,
      useClass: SharpImageProcessorService,
    },
    SharpImageProcessorService,
  ],
  exports: [IMAGE_PROCESSOR, SharpImageProcessorService],
})
export class ImageProcessingModule {}

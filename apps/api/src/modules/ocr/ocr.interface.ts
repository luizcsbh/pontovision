import { IOcrExtractedFields, IOcrFieldConfidence } from '@pontovision/shared';

export interface IOcrRecognitionOutput {
  rawText: string;
  extractedFields: IOcrExtractedFields;
  fieldConfidence: IOcrFieldConfidence;
  warnings: string[];
  reviewRequired: boolean;
  engine: string;
  engineVersion: string;
}

export interface IOcrProvider {
  recognizeText(imageBuffer: Buffer, language?: string): Promise<IOcrRecognitionOutput>;
}

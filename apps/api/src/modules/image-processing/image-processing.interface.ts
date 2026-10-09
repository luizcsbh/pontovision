export interface IProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export interface IImageProcessor {
  optimizeForDisplay(buffer: Buffer, maxWidth?: number): Promise<IProcessedImageResult>;
  preprocessForOcr(buffer: Buffer): Promise<IProcessedImageResult>;
  getImageMetadata(buffer: Buffer): Promise<{ width?: number; height?: number; format?: string }>;
}

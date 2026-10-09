export interface IStoredFile {
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface IFileStorageProvider {
  saveFile(buffer: Buffer, originalFilename: string, mimeType: string, folder?: string): Promise<IStoredFile>;
  getFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }>;
  deleteFile(storageKey: string): Promise<boolean>;
  getFilePath(storageKey: string): string;
}

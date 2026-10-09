import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { IFileStorageProvider, IStoredFile } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements IFileStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath = path.resolve(
      this.configService.get<string>('STORAGE_LOCAL_PATH') || './uploads'
    );
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async saveFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder = 'documents',
  ): Promise<IStoredFile> {
    const ext = path.extname(originalFilename) || '.jpg';
    const randomName = `${crypto.randomUUID()}${ext}`;
    const targetDir = path.join(this.basePath, folder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = path.join(targetDir, randomName);
    await fs.promises.writeFile(fullPath, buffer);

    const storageKey = `${folder}/${randomName}`;

    return {
      storageKey,
      filename: randomName,
      mimeType,
      size: buffer.length,
      url: `/api/v1/documents/files/${storageKey}`,
    };
  }

  async getFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const sanitized = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(this.basePath, sanitized);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Arquivo não encontrado: ${storageKey}`);
    }

    const buffer = await fs.promises.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'application/octet-stream';

    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    return { buffer, mimeType };
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const sanitized = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(this.basePath, sanitized);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  getFilePath(storageKey: string): string {
    const sanitized = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.basePath, sanitized);
  }
}

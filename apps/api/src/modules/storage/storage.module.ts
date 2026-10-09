import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';

export const FILE_STORAGE_PROVIDER = 'FILE_STORAGE_PROVIDER';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FILE_STORAGE_PROVIDER,
      useClass: LocalStorageProvider,
    },
    LocalStorageProvider,
  ],
  exports: [FILE_STORAGE_PROVIDER, LocalStorageProvider],
})
export class StorageModule {}

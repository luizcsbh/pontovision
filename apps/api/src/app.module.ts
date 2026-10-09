import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { TimeDocumentsModule } from './modules/time-documents/time-documents.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { ImageProcessingModule } from './modules/image-processing/image-processing.module';
import { WorkSchedulesModule } from './modules/work-schedules/work-schedules.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';

import * as path from 'path';
import * as fs from 'fs';

const envFileCandidates = [
  path.resolve(process.cwd(), 'atlas-credentials.env'),
  path.resolve(process.cwd(), '../atlas-credentials.env'),
  path.resolve(process.cwd(), '../../atlas-credentials.env'),
  path.resolve(__dirname, '../../../atlas-credentials.env'),
  path.resolve(__dirname, '../../../../atlas-credentials.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../../.env'),
].filter((f) => fs.existsSync(f));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFileCandidates.length > 0 ? envFileCandidates : ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requisições por minuto por IP
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri =
          config.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/pontovision';
        return {
          uri,
        };
      },
    }),
    StorageModule,
    AuditModule,
    ImageProcessingModule,
    AuthModule,
    UsersModule,
    TimeEntriesModule,
    TimeDocumentsModule,
    OcrModule,
    WorkSchedulesModule,
    CalendarModule,
    HolidaysModule,
    ReportsModule,
  ],
})
export class AppModule {}

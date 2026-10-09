import { IsNotEmpty, IsString, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TimeEntryType, TimeEntrySource } from '@pontovision/shared';

export class CreateTimeEntryDto {
  @ApiProperty({ example: '2026-10-10', description: 'Data da marcação YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato YYYY-MM-DD' })
  @IsNotEmpty()
  workDate: string;

  @ApiProperty({ example: '08:30', description: 'Horário da marcação HH:mm' })
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):[0-5]\d$/, { message: 'A hora deve estar no formato HH:mm' })
  @IsNotEmpty()
  time: string;

  @ApiProperty({ enum: TimeEntryType, example: TimeEntryType.ENTRY })
  @IsEnum(TimeEntryType)
  type: TimeEntryType;

  @ApiProperty({ enum: TimeEntrySource, example: TimeEntrySource.MANUAL, required: false })
  @IsOptional()
  @IsEnum(TimeEntrySource)
  source?: TimeEntrySource;

  @ApiProperty({ required: false, description: 'ID do documento/foto associada' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiProperty({ required: false, example: 'Comprovante impresso legível' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  originalOcrData?: Record<string, any>;
}

export class UpdateTimeEntryDto {
  @ApiProperty({ example: '2026-10-10', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  workDate?: string;

  @ApiProperty({ example: '08:35', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):[0-5]\d$/)
  time?: string;

  @ApiProperty({ enum: TimeEntryType, required: false })
  @IsOptional()
  @IsEnum(TimeEntryType)
  type?: TimeEntryType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

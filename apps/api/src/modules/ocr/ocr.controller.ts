import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('OCR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @ApiOperation({ summary: 'Processa OCR local em um documento de espelho/recibo' })
  @Post('process/:documentId')
  async processOcr(@Param('documentId') documentId: string, @Request() req: any) {
    return this.ocrService.processDocumentOcr(documentId, req.user.userId);
  }

  @ApiOperation({ summary: 'Obtém resultado do OCR pelo ID' })
  @Get(':id')
  async getOcrResult(@Param('id') id: string, @Request() req: any) {
    return this.ocrService.getOcrResult(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Obtém resultado do OCR vinculado a um documento' })
  @Get('document/:documentId')
  async getOcrByDocument(@Param('documentId') documentId: string, @Request() req: any) {
    return this.ocrService.getOcrByDocumentId(documentId, req.user.userId);
  }
}

import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
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

  @ApiOperation({ summary: 'Atualiza campos editados do OCR (revisão humana)' })
  @Patch(':id/fields')
  async updateOcrFields(
    @Param('id') id: string,
    @Body() body: { editedFields: Record<string, string> },
    @Request() req: any,
  ) {
    return this.ocrService.updateEditedFields(id, req.user.userId, body.editedFields);
  }

  @ApiOperation({ summary: 'Retorna thumbnail de baixa qualidade do comprovante para exibição' })
  @Get(':id/thumbnail')
  async getThumbnail(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.ocrService.getThumbnailBuffer(id, req.user.userId, res);
  }
}

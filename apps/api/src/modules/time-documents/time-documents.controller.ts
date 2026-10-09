import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TimeDocumentsService } from './time-documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Time Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class TimeDocumentsController {
  constructor(private readonly documentsService: TimeDocumentsService) {}

  @ApiOperation({ summary: 'Upload de foto de espelho ou comprovante de ponto' })
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    return this.documentsService.uploadDocument(file, req.user.userId);
  }

  @ApiOperation({ summary: 'Lista todos os documentos do usuário' })
  @Get()
  async listDocuments(@Request() req: any) {
    return this.documentsService.findUserDocuments(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtém metadados de um documento' })
  @Get(':id')
  async getDocument(@Param('id') id: string, @Request() req: any) {
    return this.documentsService.getDocumentById(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Visualiza / faz download do arquivo de imagem seguro' })
  @Get(':id/file')
  async downloadFile(
    @Param('id') id: string,
    @Query('processed') processed: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const isProcessed = processed === 'true' || processed === '1';
    const { buffer, mimeType } = await this.documentsService.getDocumentFile(
      id,
      req.user.userId,
      isProcessed,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Remove documento e seus arquivos' })
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Request() req: any) {
    return this.documentsService.deleteDocument(id, req.user.userId);
  }
}

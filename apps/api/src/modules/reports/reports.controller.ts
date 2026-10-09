import { Controller, Get, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports & Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Obtém dados completos do relatório em JSON' })
  @ApiQuery({ name: 'month', required: true, example: '2026-10' })
  @Get('json')
  async getJsonReport(@Query('month') month: string, @Request() req: any) {
    return this.reportsService.generateJsonReport(req.user.userId, month);
  }

  @ApiOperation({ summary: 'Exporta espelho de ponto em formato CSV' })
  @ApiQuery({ name: 'month', required: true, example: '2026-10' })
  @Get('csv')
  async exportCsv(@Query('month') month: string, @Request() req: any, @Res() res: Response) {
    const csv = await this.reportsService.generateCsvReport(req.user.userId, month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="espelho-ponto-${month}.csv"`);
    res.send(csv);
  }

  @ApiOperation({ summary: 'Exporta espelho de ponto em planilha Excel (XLSX)' })
  @ApiQuery({ name: 'month', required: true, example: '2026-10' })
  @Get('excel')
  async exportExcel(@Query('month') month: string, @Request() req: any, @Res() res: Response) {
    const buffer = await this.reportsService.generateExcelReport(req.user.userId, month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="espelho-ponto-${month}.xlsx"`);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Exporta espelho de ponto virtual em PDF formatado' })
  @ApiQuery({ name: 'month', required: true, example: '2026-10' })
  @Get('pdf')
  async exportPdf(@Query('month') month: string, @Request() req: any, @Res() res: Response) {
    const pdfBytes = await this.reportsService.generatePdfReport(req.user.userId, month);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="espelho-ponto-${month}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  }
}

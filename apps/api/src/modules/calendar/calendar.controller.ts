import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Calendar & Timesheet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: 'Obtém visão mensal com cálculos, horas trabalhadas e saldos diários' })
  @ApiQuery({ name: 'month', required: true, example: '2026-10', description: 'Formato YYYY-MM' })
  @Get('month')
  async getMonth(@Query('month') month: string, @Request() req: any) {
    const selectedMonth = month || new Date().toISOString().slice(0, 7);
    return this.calendarService.getMonthData(req.user.userId, selectedMonth);
  }

  @ApiOperation({ summary: 'Registra a compensação do banco com os horários da jornada padrão' })
  @Post('compensate')
  async compensate(@Body('workDate') workDate: string, @Request() req: any) {
    return this.calendarService.compensateBankHours(req.user.userId, workDate);
  }
}

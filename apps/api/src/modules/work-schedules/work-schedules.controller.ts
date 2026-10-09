import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkSchedulesService } from './work-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Work Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class WorkSchedulesController {
  constructor(private readonly schedulesService: WorkSchedulesService) {}

  @ApiOperation({ summary: 'Lista jornadas cadastradas do usuário' })
  @Get()
  async getSchedules(@Request() req: any) {
    return this.schedulesService.findUserSchedules(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtém jornada ativa padrão' })
  @Get('default')
  async getDefault(@Request() req: any) {
    return this.schedulesService.getDefaultSchedule(req.user.userId);
  }

  @ApiOperation({ summary: 'Cadastra nova jornada' })
  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.schedulesService.createSchedule(req.user.userId, data);
  }

  @ApiOperation({ summary: 'Atualiza jornada existente' })
  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() data: any) {
    return this.schedulesService.updateSchedule(id, req.user.userId, data);
  }

  @ApiOperation({ summary: 'Define jornada como padrão' })
  @Patch(':id/default')
  async setDefault(@Param('id') id: string, @Request() req: any) {
    return this.schedulesService.setDefaultSchedule(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Exclui jornada de trabalho' })
  @Delete(':id')
  async deleteSchedule(@Param('id') id: string, @Request() req: any) {
    return this.schedulesService.deleteSchedule(id, req.user.userId);
  }
}

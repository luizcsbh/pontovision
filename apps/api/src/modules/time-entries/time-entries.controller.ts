import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Time Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entries')
export class TimeEntriesController {
  constructor(private readonly entriesService: TimeEntriesService) {}

  @ApiOperation({ summary: 'Cria nova marcação de ponto (manual ou OCR confirmada)' })
  @Post()
  async create(@Body() dto: CreateTimeEntryDto, @Request() req: any) {
    return this.entriesService.create(dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Lista marcações do usuário com filtros de data' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-10-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-10-31' })
  @Get()
  async findAll(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.entriesService.findByUserAndDateRange(req.user.userId, startDate, endDate);
  }

  @ApiOperation({ summary: 'Obtém uma marcação por ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.entriesService.findOne(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Atualiza uma marcação de ponto' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
    @Request() req: any,
  ) {
    return this.entriesService.update(id, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Exclui uma marcação de ponto' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.entriesService.remove(id, req.user.userId);
  }
}

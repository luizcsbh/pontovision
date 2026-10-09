import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @ApiOperation({ summary: 'Lista feriados cadastrados' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @Get()
  async findAll(@Query('year') year?: string) {
    return this.holidaysService.findAll(year);
  }

  @ApiOperation({ summary: 'Cadastra novo feriado personalizado' })
  @Post()
  async create(@Body() body: any) {
    return this.holidaysService.create(body);
  }
}

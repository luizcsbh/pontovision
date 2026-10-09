import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';
import { HolidayScope } from '@pontovision/shared';

@Injectable()
export class HolidaysService implements OnModuleInit {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(
    @InjectModel(Holiday.name) private readonly holidayModel: Model<HolidayDocument>,
  ) {}

  async onModuleInit() {
    // Inicializa feriados nacionais comuns se a base estiver vazia
    const count = await this.holidayModel.countDocuments();
    if (count === 0) {
      this.logger.log('Populando feriados nacionais padrão...');
      const defaultHolidays = [
        { name: 'Confraternização Universal', date: '2026-01-01', scope: HolidayScope.NATIONAL },
        { name: 'Tiradentes', date: '2026-04-21', scope: HolidayScope.NATIONAL },
        { name: 'Dia do Trabalho', date: '2026-05-01', scope: HolidayScope.NATIONAL },
        { name: 'Independência do Brasil', date: '2026-09-07', scope: HolidayScope.NATIONAL },
        { name: 'Nossa Senhora Aparecida', date: '2026-10-12', scope: HolidayScope.NATIONAL },
        { name: 'Finados', date: '2026-11-02', scope: HolidayScope.NATIONAL },
        { name: 'Proclamação da República', date: '2026-11-15', scope: HolidayScope.NATIONAL },
        { name: 'Dia da Consciência Negra', date: '2026-11-20', scope: HolidayScope.NATIONAL },
        { name: 'Natal', date: '2026-12-25', scope: HolidayScope.NATIONAL },
      ];
      await this.holidayModel.insertMany(defaultHolidays);
    }
  }

  async findAll(year?: string): Promise<HolidayDocument[]> {
    const query: any = { isActive: true };
    if (year) {
      query.date = { $regex: `^${year}` };
    }
    return this.holidayModel.find(query).sort({ date: 1 }).exec();
  }

  async create(data: Partial<Holiday>): Promise<HolidayDocument> {
    return this.holidayModel.create(data);
  }

  async isHoliday(date: string): Promise<boolean> {
    const exists = await this.holidayModel.findOne({ date, isActive: true });
    return !!exists;
  }
}

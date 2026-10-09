import { Injectable } from '@nestjs/common';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { WorkSchedulesService } from '../work-schedules/work-schedules.service';
import { HolidaysService } from '../holidays/holidays.service';
import { calculateDayWork, DayCalculationResult, ITimeEntry } from '@pontovision/shared';

export interface CalendarMonthSummary {
  month: string; // YYYY-MM
  days: {
    date: string;
    dayOfWeek: number;
    isHoliday: boolean;
    holidayName?: string;
    calculation: DayCalculationResult;
  }[];
  totalWorkedMinutes: number;
  totalExpectedMinutes: number;
  balanceMinutes: number;
  incompleteDaysCount: number;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly entriesService: TimeEntriesService,
    private readonly schedulesService: WorkSchedulesService,
    private readonly holidaysService: HolidaysService,
  ) {}

  async getMonthData(userId: string, yearMonth: string): Promise<CalendarMonthSummary> {
    // yearMonth = '2026-10'
    const [year, month] = yearMonth.split('-').map((v) => parseInt(v, 10));
    const startDate = `${yearMonth}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDayNum).padStart(2, '0')}`;

    // 1. Busca todas as batidas do mês
    const rawEntries = await this.entriesService.findByUserAndDateRange(userId, startDate, endDate);

    // 2. Busca feriados do ano
    const holidays = await this.holidaysService.findAll(String(year));
    const holidayMap = new Map<string, string>();
    for (const h of holidays) {
      holidayMap.set(h.date, h.name);
    }

    // 3. Busca jornada padrão do usuário
    const schedule = await this.schedulesService.getDefaultSchedule(userId);

    // 4. Agrupa batidas por data
    const entriesByDate = new Map<string, any[]>();
    for (const entry of rawEntries) {
      if (!entriesByDate.has(entry.workDate)) {
        entriesByDate.set(entry.workDate, []);
      }
      entriesByDate.get(entry.workDate)!.push(entry);
    }

    // 5. Monta todos os dias do mês
    let totalWorkedMinutes = 0;
    let totalExpectedMinutes = 0;
    let incompleteDaysCount = 0;

    const days = [];
    for (let d = 1; d <= lastDayNum; d++) {
      const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month - 1, d);
      const dayOfWeek = dayDate.getDay(); // 0 = Domingo, 1 = Segunda...

      const isHoliday = holidayMap.has(dateStr);
      const holidayName = holidayMap.get(dateStr);

      const dayRule = schedule?.weeklyRules?.find((r) => r.dayOfWeek === dayOfWeek);
      // Se for feriado, horas previstas são zeradas por padrão a menos que configurado o contrário
      const effectiveRule = isHoliday ? { ...dayRule, isEnabled: false, expectedWorkMinutes: 0 } : dayRule;

      const dayEntries = entriesByDate.get(dateStr) || [];
      const calc = calculateDayWork(
        dateStr,
        dayEntries as any,
        effectiveRule as any,
        schedule?.toleranceMinutes || 10,
      );

      totalWorkedMinutes += calc.totalWorkedMinutes;
      totalExpectedMinutes += calc.expectedWorkMinutes;
      if (calc.isIncomplete) incompleteDaysCount++;

      days.push({
        date: dateStr,
        dayOfWeek,
        isHoliday,
        holidayName,
        calculation: calc,
      });
    }

    return {
      month: yearMonth,
      days,
      totalWorkedMinutes,
      totalExpectedMinutes,
      balanceMinutes: totalWorkedMinutes - totalExpectedMinutes,
      incompleteDaysCount,
    };
  }
}

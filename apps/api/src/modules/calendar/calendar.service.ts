import { BadRequestException, Injectable } from '@nestjs/common';
import {
  calculateAvailableBankHours,
  calculateDayWork,
  DayCalculationResult,
  TimeEntrySource,
  TimeEntryType,
} from '@pontovision/shared';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { WorkSchedulesService } from '../work-schedules/work-schedules.service';
import { HolidaysService } from '../holidays/holidays.service';

export interface CalendarMonthSummary {
  month: string;
  days: {
    date: string;
    dayOfWeek: number;
    isHoliday: boolean;
    holidayName?: string;
    calculation: DayCalculationResult;
    rawEntries?: any[];
    allEntries?: any[];
  }[];
  totalWorkedMinutes: number;
  totalExpectedMinutes: number;
  balanceMinutes: number;
  incompleteDaysCount: number;
  earliestExpirationDate?: string;
  latestExpirationDate?: string;
  availableBankMinutes: number;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly entriesService: TimeEntriesService,
    private readonly schedulesService: WorkSchedulesService,
    private readonly holidaysService: HolidaysService,
  ) {}

  private calculateBankSummary(historyEntries: any[], schedule: any, holidays: any[], asOfDate: string) {
    const holidayDates = new Set(holidays.map((holiday) => holiday.date));
    const entriesByDate = new Map<string, any[]>();
    for (const entry of historyEntries) {
      const group = entriesByDate.get(entry.workDate) || [];
      group.push(entry);
      entriesByDate.set(entry.workDate, group);
    }

    const credits: Array<{ workDate: string; minutes: number }> = [];
    const compensations: Array<{ workDate: string; minutes: number }> = [];
    for (const [date, dayEntries] of entriesByDate) {
      const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
      const dayRule = schedule?.weeklyRules?.find((rule) => rule.dayOfWeek === dayOfWeek);
      const effectiveRule = holidayDates.has(date)
        ? { ...dayRule, isEnabled: false, expectedWorkMinutes: 0 }
        : dayRule;
      const calculation = calculateDayWork(
        date,
        dayEntries as any,
        effectiveRule as any,
        schedule?.toleranceMinutes || 10,
      );

      if (dayEntries.some((entry) => entry.source === TimeEntrySource.COMPENSATED)) {
        compensations.push({ workDate: date, minutes: calculation.expectedWorkMinutes });
      } else if (calculation.balanceMinutes > 0) {
        credits.push({ workDate: date, minutes: calculation.balanceMinutes });
      }
    }

    return calculateAvailableBankHours(credits, compensations, asOfDate);
  }

  async getMonthData(userId: string, yearMonth: string): Promise<CalendarMonthSummary> {
    const [year, month] = yearMonth.split('-').map((value) => parseInt(value, 10));
    const startDate = `${yearMonth}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${String(lastDayNum).padStart(2, '0')}`;
    const historyEntries = await this.entriesService.findByUserAndDateRange(userId, undefined, endDate);
    const rawEntries = historyEntries.filter((entry) => entry.workDate >= startDate);
    const holidays = await this.holidaysService.findAll();
    const holidayMap = new Map<string, string>();
    for (const holiday of holidays) holidayMap.set(holiday.date, holiday.name);
    const schedule = await this.schedulesService.getDefaultSchedule(userId);
    const bankSummary = this.calculateBankSummary(historyEntries, schedule, holidays, endDate);

    const entriesByDate = new Map<string, any[]>();
    for (const entry of rawEntries) {
      const group = entriesByDate.get(entry.workDate) || [];
      group.push(entry);
      entriesByDate.set(entry.workDate, group);
    }

    let totalWorkedMinutes = 0;
    let totalExpectedMinutes = 0;
    let incompleteDaysCount = 0;
    const days = [];
    for (let day = 1; day <= lastDayNum; day++) {
      const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const isHoliday = holidayMap.has(date);
      const dayRule = schedule?.weeklyRules?.find((rule) => rule.dayOfWeek === dayOfWeek);
      const effectiveRule = isHoliday
        ? { ...dayRule, isEnabled: false, expectedWorkMinutes: 0 }
        : dayRule;
      const dayEntries = entriesByDate.get(date) || [];
      const calculation = calculateDayWork(
        date,
        dayEntries as any,
        effectiveRule as any,
        schedule?.toleranceMinutes || 10,
      );

      totalWorkedMinutes += calculation.totalWorkedMinutes;
      totalExpectedMinutes += calculation.expectedWorkMinutes;
      if (calculation.isIncomplete) incompleteDaysCount++;
      days.push({
        date,
        dayOfWeek,
        isHoliday,
        holidayName: holidayMap.get(date),
        calculation,
        rawEntries: dayEntries,
        allEntries: dayEntries,
      });
    }

    return {
      month: yearMonth,
      days,
      totalWorkedMinutes,
      totalExpectedMinutes,
      balanceMinutes: totalWorkedMinutes - totalExpectedMinutes,
      incompleteDaysCount,
      earliestExpirationDate: bankSummary.earliestExpirationDate,
      latestExpirationDate: bankSummary.latestExpirationDate,
      availableBankMinutes: bankSummary.minutes,
    };
  }

  async compensateBankHours(userId: string, workDate: string) {
    const parsedDate = new Date(`${workDate}T00:00:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(workDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== workDate
    ) {
      throw new BadRequestException('Informe uma data válida no formato AAAA-MM-DD.');
    }

    const schedule = await this.schedulesService.getDefaultSchedule(userId);
    if (!schedule) throw new BadRequestException('Cadastre uma jornada padrão antes de compensar o banco.');
    const dayOfWeek = parsedDate.getDay();
    const dayRule = schedule.weeklyRules?.find((rule) => rule.dayOfWeek === dayOfWeek);
    const holidays = await this.holidaysService.findAll();
    if (!dayRule?.isEnabled || holidays.some((holiday) => holiday.date === workDate)) {
      throw new BadRequestException('A data escolhida não possui jornada de trabalho habilitada.');
    }

    const plannedTimes = [
      dayRule.plannedEntry,
      dayRule.plannedBreakStart,
      dayRule.plannedBreakEnd,
      dayRule.plannedExit,
    ];
    if (plannedTimes.some((time) => !time) || dayRule.expectedWorkMinutes <= 0) {
      throw new BadRequestException('A jornada desse dia precisa ter os quatro horários planejados cadastrados.');
    }

    const historyEntries = await this.entriesService.findByUserAndDateRange(userId, undefined, workDate);
    if (historyEntries.some((entry) => entry.workDate === workDate)) {
      throw new BadRequestException('Já existem marcações registradas para essa data.');
    }
    const bankSummary = this.calculateBankSummary(historyEntries, schedule, holidays, workDate);
    if (bankSummary.minutes < dayRule.expectedWorkMinutes) {
      throw new BadRequestException('O saldo positivo disponível não cobre a jornada de compensação.');
    }

    const entries = await this.entriesService.createCompensationEntries(
      workDate,
      [
        { time: plannedTimes[0]!, type: TimeEntryType.ENTRY },
        { time: plannedTimes[1]!, type: TimeEntryType.INTERVAL_START },
        { time: plannedTimes[2]!, type: TimeEntryType.INTERVAL_END },
        { time: plannedTimes[3]!, type: TimeEntryType.EXIT },
      ],
      userId,
    );

    return {
      entries,
      compensatedMinutes: dayRule.expectedWorkMinutes,
      availableBankMinutes: bankSummary.minutes - dayRule.expectedWorkMinutes,
    };
  }
}

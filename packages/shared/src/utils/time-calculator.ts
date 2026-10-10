import { TimeEntryType, ITimeEntry, IDayScheduleRule } from '../types';

export interface DayCalculationResult {
  workDate: string;
  entries: ITimeEntry[];
  rawEntries?: ITimeEntry[];
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  expectedWorkMinutes: number;
  balanceMinutes: number; // positive = overtime, negative = missing
  isIncomplete: boolean;
  warnings: string[];
  expirationDate?: string; // Data de vencimento das horas extras para compensação/pagamento (+6 meses, Art. 59 §5º CLT)
}

/**
 * Adiciona meses a uma data YYYY-MM-DD mantendo o dia correspondente ou o último dia do mês destino.
 * Regra CLT Banco de Horas (Art. 59 § 5º da CLT): compensação ou pagamento em até 6 meses.
 */
export function calculateExpirationDate(dateStr: string, months = 6): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const totalMonths = month + months;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);

  const y = targetYear;
  const m = String(targetMonth + 1).padStart(2, '0');
  const d = String(targetDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface BankHourCredit {
  workDate: string;
  minutes: number;
}

export interface BankHourCompensation {
  workDate: string;
  minutes: number;
}

export interface AvailableBankHours {
  minutes: number;
  earliestExpirationDate?: string;
  latestExpirationDate?: string;
}

export function calculateAvailableBankHours(
  credits: BankHourCredit[],
  compensations: BankHourCompensation[],
  asOfDate: string,
): AvailableBankHours {
  const events = [
    ...credits.filter((credit) => credit.minutes > 0).map((credit) => ({ ...credit, kind: 'credit' as const })),
    ...compensations.filter((item) => item.minutes > 0).map((item) => ({ ...item, kind: 'compensation' as const })),
  ].sort((a, b) => a.workDate.localeCompare(b.workDate) || (a.kind === 'credit' ? -1 : 1));
  const lots: Array<{ workDate: string; expirationDate: string; minutes: number }> = [];

  for (const event of events) {
    if (event.workDate > asOfDate) continue;

    for (let index = lots.length - 1; index >= 0; index--) {
      if (lots[index].expirationDate < event.workDate) lots.splice(index, 1);
    }

    if (event.kind === 'credit') {
      lots.push({
        workDate: event.workDate,
        expirationDate: calculateExpirationDate(event.workDate),
        minutes: event.minutes,
      });
      continue;
    }

    let remaining = event.minutes;
    lots.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.workDate.localeCompare(b.workDate));
    for (const lot of lots) {
      const deduction = Math.min(lot.minutes, remaining);
      lot.minutes -= deduction;
      remaining -= deduction;
      if (remaining === 0) break;
    }
    for (let index = lots.length - 1; index >= 0; index--) {
      if (lots[index].minutes === 0) lots.splice(index, 1);
    }
  }

  for (let index = lots.length - 1; index >= 0; index--) {
    if (lots[index].expirationDate < asOfDate) lots.splice(index, 1);
  }

  const expirations = lots.map((lot) => lot.expirationDate).sort();
  return {
    minutes: lots.reduce((total, lot) => total + lot.minutes, 0),
    earliestExpirationDate: expirations[0],
    latestExpirationDate: expirations[expirations.length - 1],
  };
}

/**
 * Converts "HH:mm" or "HH:mm:ss" to minutes from midnight.
 */
export function timeStringToMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes to "+HH:mm" or "-HH:mm" string.
 */
export function minutesToTimeString(minutes: number, showSign = false): string {
  const isNegative = minutes < 0;
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = showSign ? (isNegative ? '-' : '+') : (isNegative ? '-' : '');
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Pure domain function to calculate daily worked hours.
 * Follows CLT rules and handles:
 * - Pairs of entries/exits
 * - 4 punches standard (Entry, Break Start, Break End, Exit)
 * - Irregular number of punches (odd punches marked as incomplete)
 * - Sorting of punches
 * - Tolerances (e.g. 10 minutes)
 */
export function calculateDayWork(
  workDate: string,
  rawEntries: ITimeEntry[],
  rule?: IDayScheduleRule,
  toleranceMinutes = 10,
): DayCalculationResult {
  const warnings: string[] = [];
  
  // Sort entries chronologically by time
  const sortedEntries = [...rawEntries].sort((a, b) => {
    return timeStringToMinutes(a.time) - timeStringToMinutes(b.time);
  });

  // Filter unique times to avoid duplicated punches at exact same minute
  const uniqueEntries: ITimeEntry[] = [];
  const seenTimes = new Set<string>();
  for (const entry of sortedEntries) {
    if (seenTimes.has(entry.time)) {
      warnings.push(`Marcação duplicada detectada e ignorada: ${entry.time}`);
    } else {
      seenTimes.add(entry.time);
      uniqueEntries.push(entry);
    }
  }

  const isIncomplete = uniqueEntries.length % 2 !== 0;
  if (isIncomplete && uniqueEntries.length > 0) {
    warnings.push('Dia com número ímpar de marcações (registro incompleto).');
  }

  let totalWorkedMinutes = 0;
  let totalBreakMinutes = 0;

  // If there are pairs (e.g. [Entry, Interval_Start], [Interval_End, Exit], ...)
  for (let i = 0; i < uniqueEntries.length - 1; i += 2) {
    const entryMin = timeStringToMinutes(uniqueEntries[i].time);
    let exitMin = timeStringToMinutes(uniqueEntries[i + 1].time);

    // Support overnight punch (crossing midnight, e.g. 22:00 to 06:00)
    if (exitMin < entryMin) {
      exitMin += 24 * 60;
    }

    const periodDuration = exitMin - entryMin;
    totalWorkedMinutes += periodDuration;

    // Check interval between periods if there's a next segment
    if (i + 2 < uniqueEntries.length) {
      const nextEntryMin = timeStringToMinutes(uniqueEntries[i + 2].time);
      const normalizedExitMin = timeStringToMinutes(uniqueEntries[i + 1].time);
      const breakDuration = (nextEntryMin >= normalizedExitMin) 
        ? nextEntryMin - normalizedExitMin
        : (nextEntryMin + 24 * 60) - normalizedExitMin;
      totalBreakMinutes += breakDuration;
    }
  }

  const expectedWorkMinutes = (rule && rule.isEnabled) ? rule.expectedWorkMinutes : 0;
  let rawBalance = totalWorkedMinutes - expectedWorkMinutes;

  // Apply tolerance: if within tolerance, balance is considered 0 (Art. 58 CLT §1º: max 5min per punch / 10min total)
  let balanceMinutes = rawBalance;
  if (Math.abs(rawBalance) <= toleranceMinutes) {
    balanceMinutes = 0;
  }

  const expirationDate = balanceMinutes > 0 ? calculateExpirationDate(workDate, 6) : undefined;

  return {
    workDate,
    entries: uniqueEntries,
    rawEntries: sortedEntries,
    totalWorkedMinutes,
    totalBreakMinutes,
    expectedWorkMinutes,
    balanceMinutes,
    isIncomplete,
    warnings,
    expirationDate,
  };
}

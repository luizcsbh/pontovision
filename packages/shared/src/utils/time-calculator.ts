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
  };
}

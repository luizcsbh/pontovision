import { calculateDayWork, timeStringToMinutes, minutesToTimeString } from '../time-calculator';
import { ITimeEntry, TimeEntryType, TimeEntrySource, TimeEntryStatus } from '../../types';

describe('Time Calculator Domain Logic', () => {
  it('should calculate minutes from string and back', () => {
    expect(timeStringToMinutes('08:30')).toBe(510);
    expect(minutesToTimeString(510)).toBe('08:30');
    expect(minutesToTimeString(-45, true)).toBe('-00:45');
    expect(minutesToTimeString(45, true)).toBe('+00:45');
  });

  it('should calculate 4 standard punches (08:00 - 12:00, 13:00 - 17:00)', () => {
    const entries: ITimeEntry[] = [
      {
        id: '1',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '08:00',
        type: TimeEntryType.ENTRY,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '12:00',
        type: TimeEntryType.INTERVAL_START,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '13:00',
        type: TimeEntryType.INTERVAL_END,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '17:00',
        type: TimeEntryType.EXIT,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const rule = {
      dayOfWeek: 4,
      isEnabled: true,
      expectedWorkMinutes: 480, // 8h
    };

    const res = calculateDayWork('2026-10-01', entries, rule);
    expect(res.totalWorkedMinutes).toBe(480); // (12-8) + (17-13) = 4h + 4h = 8h (480 min)
    expect(res.totalBreakMinutes).toBe(60); // 13:00 - 12:00 = 60 min
    expect(res.balanceMinutes).toBe(0);
    expect(res.isIncomplete).toBe(false);
  });

  it('should flag incomplete odd punches', () => {
    const entries: ITimeEntry[] = [
      {
        id: '1',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '08:00',
        type: TimeEntryType.ENTRY,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '12:00',
        type: TimeEntryType.INTERVAL_START,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        userId: 'u1',
        workDate: '2026-10-01',
        time: '13:00',
        type: TimeEntryType.INTERVAL_END,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const res = calculateDayWork('2026-10-01', entries);
    expect(res.isIncomplete).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});

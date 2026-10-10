import { calculateDayWork, timeStringToMinutes, minutesToTimeString, calculateExpirationDate } from '../time-calculator';
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

  it('should calculate 6 months expiration date correctly according to CLT rule', () => {
    // Normal 6 months
    expect(calculateExpirationDate('2026-10-09', 6)).toBe('2027-04-09');
    expect(calculateExpirationDate('2026-01-15', 6)).toBe('2026-07-15');
    // End of month adjustment (e.g. August 31 + 6 months -> February 28 in non-leap year 2027)
    expect(calculateExpirationDate('2026-08-31', 6)).toBe('2027-02-28');
  });

  it('should include expirationDate when daily balance has positive overtime hours', () => {
    const entries: ITimeEntry[] = [
      {
        id: '1',
        userId: 'u1',
        workDate: '2026-10-09',
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
        workDate: '2026-10-09',
        time: '18:00', // 10 hours = 600 min
        type: TimeEntryType.EXIT,
        source: TimeEntrySource.MANUAL,
        status: TimeEntryStatus.ACTIVE,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    // Expected work: 8 hours = 480 min. Overtime = +120 min
    const rule = {
      dayOfWeek: 5,
      isEnabled: true,
      expectedWorkMinutes: 480,
    };
    const res = calculateDayWork('2026-10-09', entries, rule);
    expect(res.balanceMinutes).toBe(120);
    expect(res.expirationDate).toBe('2027-04-09');
  });
});

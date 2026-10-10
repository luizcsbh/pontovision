import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TimeEntriesService } from '../time-entries.service';
import { TimeEntryType, TimeEntrySource, TimeEntryStatus } from '@pontovision/shared';

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let mockEntryModel: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockEntryModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };

    mockAuditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    service = new TimeEntriesService(mockEntryModel as any, mockAuditService as any);
  });

  it('should create an entry when no entry of that type exists on the day', async () => {
    mockEntryModel.findOne.mockResolvedValue(null);
    mockEntryModel.create.mockResolvedValue({
      _id: 'entry-1',
      workDate: '2026-10-09',
      time: '08:00',
      type: TimeEntryType.ENTRY,
      toObject: () => ({ _id: 'entry-1', workDate: '2026-10-09', time: '08:00' }),
    });

    const res = await service.create(
      {
        workDate: '2026-10-09',
        time: '08:00',
        type: TimeEntryType.ENTRY,
        source: TimeEntrySource.MANUAL,
      },
      '507f1f77bcf86cd799439011',
    );

    expect(res).toBeDefined();
    expect(mockEntryModel.create).toHaveBeenCalled();
  });

  it('should block creation and throw BadRequestException if entry of that type already exists on the day', async () => {
    mockEntryModel.findOne.mockResolvedValue({
      _id: 'existing-entry-1',
      workDate: '2026-10-09',
      type: TimeEntryType.ENTRY,
      status: TimeEntryStatus.ACTIVE,
    });

    await expect(
      service.create(
        {
          workDate: '2026-10-09',
          time: '08:15',
          type: TimeEntryType.ENTRY,
          source: TimeEntrySource.MANUAL,
        },
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockEntryModel.create).not.toHaveBeenCalled();
  });

  it('should allow creation if previous entry was deleted (findOne returns null)', async () => {
    // Simulando que a anterior foi excluída do banco
    mockEntryModel.findOne.mockResolvedValue(null);
    mockEntryModel.create.mockResolvedValue({
      _id: 'new-entry-2',
      workDate: '2026-10-09',
      time: '08:30',
      type: TimeEntryType.ENTRY,
      toObject: () => ({ _id: 'new-entry-2' }),
    });

    const res = await service.create(
      {
        workDate: '2026-10-09',
        time: '08:30',
        type: TimeEntryType.ENTRY,
        source: TimeEntrySource.MANUAL,
      },
      '507f1f77bcf86cd799439011',
    );

    expect(res).toBeDefined();
    expect(mockEntryModel.create).toHaveBeenCalled();
  });

  it('should apply the same rule to other entry types like INTERVAL_START, EXIT', async () => {
    mockEntryModel.findOne.mockResolvedValue({
      _id: 'existing-exit-1',
      workDate: '2026-10-09',
      type: TimeEntryType.EXIT,
      status: TimeEntryStatus.ACTIVE,
    });

    await expect(
      service.create(
        {
          workDate: '2026-10-09',
          time: '18:00',
          type: TimeEntryType.EXIT,
          source: TimeEntrySource.MANUAL,
        },
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toThrow('Já existe uma marcação de Saída registrada para o dia 2026-10-09');
  });
});

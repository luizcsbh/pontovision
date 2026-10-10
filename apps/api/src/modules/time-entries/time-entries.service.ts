import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimeEntry, TimeEntryDocument } from './schemas/time-entry.schema';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';
import { AuditService } from '../audit/audit.service';
import { TimeEntrySource, TimeEntryStatus, AuditAction, TimeEntryType } from '@pontovision/shared';

@Injectable()
export class TimeEntriesService {
  constructor(
    @InjectModel(TimeEntry.name) private readonly entryModel: Model<TimeEntryDocument>,
    private readonly auditService: AuditService,
  ) {}

  private getTypeLabel(type: TimeEntryType): string {
    switch (type) {
      case TimeEntryType.ENTRY:
        return 'Entrada';
      case TimeEntryType.INTERVAL_START:
        return 'Saída para Intervalo';
      case TimeEntryType.INTERVAL_END:
        return 'Retorno do Intervalo';
      case TimeEntryType.EXIT:
        return 'Saída';
      case TimeEntryType.OTHER:
        return 'Outra Marcação';
      default:
        return type;
    }
  }

  async create(dto: CreateTimeEntryDto, userId: string): Promise<TimeEntryDocument> {
    // Regra: Bloquear novo cadastro do mesmo tipo no mesmo dia, salvo se a anterior foi excluída
    const existing = await this.entryModel.findOne({
      userId: new Types.ObjectId(userId),
      workDate: dto.workDate,
      type: dto.type,
      status: { $ne: TimeEntryStatus.ARCHIVED },
    });

    if (existing) {
      const typeLabel = this.getTypeLabel(dto.type);
      throw new BadRequestException(
        `Já existe uma marcação de ${typeLabel} registrada para o dia ${dto.workDate}. Para registrar uma nova marcação de ${typeLabel}, exclua a marcação anterior.`,
      );
    }

    const entry = await this.entryModel.create({
      userId: new Types.ObjectId(userId),
      workDate: dto.workDate,
      time: dto.time,
      type: dto.type,
      source: dto.source || TimeEntrySource.MANUAL,
      status: TimeEntryStatus.ACTIVE,
      documentId: dto.documentId ? new Types.ObjectId(dto.documentId) : null,
      nsr: dto.nsr ? dto.nsr.trim() : undefined,
      notes: dto.notes,
      originalOcrData: dto.originalOcrData,
      createdBy: new Types.ObjectId(userId),
    });

    await this.auditService.logAction({
      userId,
      actorId: userId,
      entityType: 'TimeEntry',
      entityId: entry._id.toString(),
      action: AuditAction.CREATE,
      changedFields: {
        created: { before: null, after: entry.toObject() },
      },
    });

    return entry;
  }

  async findByUserAndDateRange(userId: string, startDate?: string, endDate?: string) {
    const query: any = {
      userId: new Types.ObjectId(userId),
      status: { $ne: TimeEntryStatus.ARCHIVED },
    };

    if (startDate && endDate) {
      query.workDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.workDate = startDate;
    }

    return this.entryModel
      .find(query)
      .sort({ workDate: 1, time: 1 })
      .populate('documentId', 'originalFilename mimeType fileSize processedStorageKey')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<TimeEntryDocument> {
    const entry = await this.entryModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!entry) throw new NotFoundException('Marcação de ponto não encontrada.');
    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, userId: string): Promise<TimeEntryDocument> {
    const entry = await this.findOne(id, userId);
    const beforeState = entry.toObject();

    const targetDate = dto.workDate || entry.workDate;
    const targetType = dto.type || entry.type;

    if (dto.workDate || dto.type) {
      const existing = await this.entryModel.findOne({
        _id: { $ne: entry._id },
        userId: new Types.ObjectId(userId),
        workDate: targetDate,
        type: targetType,
        status: { $ne: TimeEntryStatus.ARCHIVED },
      });

      if (existing) {
        const typeLabel = this.getTypeLabel(targetType);
        throw new BadRequestException(
          `Já existe uma marcação de ${typeLabel} registrada para o dia ${targetDate}. Para registrar uma nova marcação de ${typeLabel}, exclua a marcação anterior.`,
        );
      }
    }

    if (dto.workDate) entry.workDate = dto.workDate;
    if (dto.time) entry.time = dto.time;
    if (dto.type) entry.type = dto.type;
    if (dto.nsr !== undefined) entry.nsr = dto.nsr ? dto.nsr.trim() : undefined;
    if (dto.notes !== undefined) entry.notes = dto.notes;
    entry.source = TimeEntrySource.CORRECTED;

    await entry.save();

    await this.auditService.logAction({
      userId,
      actorId: userId,
      entityType: 'TimeEntry',
      entityId: entry._id.toString(),
      action: AuditAction.UPDATE,
      changedFields: {
        diff: { before: beforeState, after: entry.toObject() },
      },
    });

    return entry;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const entry = await this.findOne(id, userId);

    await this.auditService.logAction({
      userId,
      actorId: userId,
      entityType: 'TimeEntry',
      entityId: entry._id.toString(),
      action: AuditAction.DELETE,
      changedFields: {
        deleted: { before: entry.toObject(), after: null },
      },
    });

    await this.entryModel.deleteOne({ _id: entry._id });
    return true;
  }
}

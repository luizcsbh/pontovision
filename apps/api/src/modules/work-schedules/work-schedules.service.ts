import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkSchedule, WorkScheduleDocument } from './schemas/work-schedule.schema';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectModel(WorkSchedule.name) private readonly scheduleModel: Model<WorkScheduleDocument>,
  ) {}

  async findUserSchedules(userId: string): Promise<WorkScheduleDocument[]> {
    return this.scheduleModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async getDefaultSchedule(userId: string): Promise<WorkScheduleDocument | null> {
    return this.scheduleModel.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
    });
  }

  async createSchedule(userId: string, data: Partial<WorkSchedule>): Promise<WorkScheduleDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const existingCount = await this.scheduleModel.countDocuments({ userId: userObjectId });

    // Se for a primeira jornada, torna padrão automaticamente
    const shouldBeDefault = existingCount === 0 || !!data.isDefault;

    if (shouldBeDefault) {
      await this.scheduleModel.updateMany(
        { userId: userObjectId },
        { isDefault: false },
      );
    }

    return this.scheduleModel.create({
      ...data,
      userId: userObjectId,
      isDefault: shouldBeDefault,
    });
  }

  async updateSchedule(id: string, userId: string, data: Partial<WorkSchedule>): Promise<WorkScheduleDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const scheduleObjectId = new Types.ObjectId(id);

    if (data.isDefault) {
      await this.scheduleModel.updateMany(
        { userId: userObjectId },
        { isDefault: false },
      );
    }

    const schedule = await this.scheduleModel.findOneAndUpdate(
      { _id: scheduleObjectId, userId: userObjectId },
      { $set: data },
      { new: true },
    );
    if (!schedule) throw new NotFoundException('Jornada não encontrada.');
    return schedule;
  }

  async setDefaultSchedule(id: string, userId: string): Promise<WorkScheduleDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const scheduleObjectId = new Types.ObjectId(id);

    const target = await this.scheduleModel.findOne({ _id: scheduleObjectId, userId: userObjectId });
    if (!target) throw new NotFoundException('Jornada não encontrada.');

    await this.scheduleModel.updateMany({ userId: userObjectId }, { isDefault: false });
    target.isDefault = true;
    await target.save();

    return target;
  }

  async deleteSchedule(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const userObjectId = new Types.ObjectId(userId);
    const scheduleObjectId = new Types.ObjectId(id);

    const schedule = await this.scheduleModel.findOne({
      _id: scheduleObjectId,
      userId: userObjectId,
    });
    if (!schedule) throw new NotFoundException('Jornada não encontrada.');

    const totalCount = await this.scheduleModel.countDocuments({ userId: userObjectId });
    if (totalCount <= 1) {
      throw new BadRequestException('Não é possível excluir a única jornada cadastrada. Cadastre outra jornada antes de remover esta.');
    }

    const wasDefault = schedule.isDefault;
    await this.scheduleModel.deleteOne({ _id: scheduleObjectId });

    // Se a jornada removida era a padrão, promove a primeira restante a padrão
    if (wasDefault) {
      const remaining = await this.scheduleModel.findOne({ userId: userObjectId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return { success: true, message: 'Jornada excluída com sucesso.' };
  }
}

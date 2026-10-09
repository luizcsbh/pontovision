import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkSchedule, WorkScheduleDocument } from './schemas/work-schedule.schema';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectModel(WorkSchedule.name) private readonly scheduleModel: Model<WorkScheduleDocument>,
  ) {}

  async findUserSchedules(userId: string): Promise<WorkScheduleDocument[]> {
    return this.scheduleModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async getDefaultSchedule(userId: string): Promise<WorkScheduleDocument | null> {
    return this.scheduleModel.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
    });
  }

  async createSchedule(userId: string, data: Partial<WorkSchedule>): Promise<WorkScheduleDocument> {
    if (data.isDefault) {
      await this.scheduleModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false },
      );
    }
    return this.scheduleModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
    });
  }

  async updateSchedule(id: string, userId: string, data: Partial<WorkSchedule>): Promise<WorkScheduleDocument> {
    if (data.isDefault) {
      await this.scheduleModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false },
      );
    }
    const schedule = await this.scheduleModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true },
    );
    if (!schedule) throw new NotFoundException('Jornada não encontrada.');
    return schedule;
  }
}

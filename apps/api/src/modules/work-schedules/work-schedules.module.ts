import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkSchedule, WorkScheduleSchema } from './schemas/work-schedule.schema';
import { WorkSchedulesService } from './work-schedules.service';
import { WorkSchedulesController } from './work-schedules.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkSchedule.name, schema: WorkScheduleSchema }]),
  ],
  controllers: [WorkSchedulesController],
  providers: [WorkSchedulesService],
  exports: [WorkSchedulesService],
})
export class WorkSchedulesModule {}

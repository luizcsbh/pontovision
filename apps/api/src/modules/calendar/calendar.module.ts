import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { WorkSchedulesModule } from '../work-schedules/work-schedules.module';
import { HolidaysModule } from '../holidays/holidays.module';

@Module({
  imports: [TimeEntriesModule, WorkSchedulesModule, HolidaysModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

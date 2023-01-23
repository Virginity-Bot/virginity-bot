import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BotModule } from 'src/bot/bot.module';
import { DatabaseModule } from 'src/database/database.module';
import { TasksService } from './scheduling.service';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, BotModule],
  providers: [TasksService],
  exports: [ScheduleModule, TasksService],
})
export class SchedulingModule {}

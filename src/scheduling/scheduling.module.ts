import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BotModule } from 'src/bot/bot.module';
import { DatabaseModule } from 'src/database/database.module';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    forwardRef(() => BotModule),
  ],
  providers: [SchedulingService],
  exports: [ScheduleModule, SchedulingService],
})
export class SchedulingModule {}

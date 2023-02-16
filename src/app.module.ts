import { Module } from '@nestjs/common';

import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    DatabaseModule,
    StorageModule,
    BotModule,
    SchedulingModule,
  ],
})
export class AppModule {}

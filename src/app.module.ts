import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    DatabaseModule,
    BotModule,
    SchedulingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

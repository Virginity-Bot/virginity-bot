import { Module } from '@nestjs/common';

import { BotModule } from './bot/bot.module';
import { DatabaseModule } from './database/database.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { PrometheusModule } from './prometheus/prometheus.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    DatabaseModule,
    StorageModule,
    BotModule,
    SchedulingModule,
    PrometheusModule,
    HealthcheckModule,
  ],
})
export class AppModule {}

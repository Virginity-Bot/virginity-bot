import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityName } from '@mikro-orm/core';

import config from 'src/mikro-orm.config';
import { DatabaseService } from 'src/database/database.service';
import { BotModule } from 'src/bot/bot.module';
import { PrometheusModule } from 'src/prometheus/prometheus.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    MikroOrmModule.forFeature({
      entities: config.entities as EntityName<Partial<unknown>>[],
    }),
    forwardRef(() => BotModule),
    forwardRef(() => PrometheusModule),
  ],
  providers: [DatabaseService],
  exports: [MikroOrmModule, DatabaseService],
})
export class DatabaseModule {}

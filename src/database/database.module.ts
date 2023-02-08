import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityName } from '@mikro-orm/core';

import config from 'src/mikro-orm.config';
import { DatabaseService } from 'src/database/database.service';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({
      entities: config.entities as EntityName<Partial<unknown>>[],
    }),
    forwardRef(() => BotModule),
  ],
  providers: [DatabaseService],
  exports: [MikroOrmModule, DatabaseService],
})
export class DatabaseModule {}

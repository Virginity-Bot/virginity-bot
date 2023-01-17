import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';

import { DiscordConfigService } from './bot/discord-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Virgin } from './entities/virgin.entity';
import { Guild } from './entities/guild.entity';
import config from './config/configuration';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    MikroOrmModule.forRoot({
      entities: [Virgin, Guild],
      type: config.db.type,
      clientUrl: config.db.url,
      pool: {
        min: config.db.pool.min,
        max: config.db.pool.max,
      },
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

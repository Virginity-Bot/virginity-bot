import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import { DiscordConfigService } from './bot/discord-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    MikroOrmModule.forRoot(),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

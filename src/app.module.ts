import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import { DiscordConfigService } from './bot/discord-config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { VCEvent } from './entities/vc-event.entity';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ load: [configuration] }),
    DatabaseModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

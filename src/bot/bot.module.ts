import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { DiscordConfigService } from 'src/bot/discord-config.service';

import { SlashCommandsModule } from './commands/slash-commands.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    SlashCommandsModule,
    EventsModule,
  ],
})
export class BotModule {}

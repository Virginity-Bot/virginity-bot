import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { DiscordConfigService } from 'src/bot/discord-config.service';

import { SlashCommandsModule } from './commands/slash-commands.module';
import { IntroMusic } from './events/intro-music';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    SlashCommandsModule,
  ],
  providers: [IntroMusic],
})
export class BotModule {}

import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { DiscordConfigService } from 'src/bot/discord-config.service';

import { SlashCommandsModule } from './commands/slash-commands.module';
import { VCConnect } from './events/vc-connect';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    SlashCommandsModule,
  ],
  providers: [VCConnect],
})
export class BotModule {}

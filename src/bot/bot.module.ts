import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { DiscordConfigService } from 'src/bot/discord-config.service';
import { DatabaseModule } from 'src/database/database.module';
import { LeaderboardCommand } from './commands/leaderboard.command';

import { DiscordHelperService } from './discord-helper.service';
import { CreateWitnessedGuilds } from './events/create-witnessed-guilds';
import { IntroMusic } from './events/intro-music';
import { Track } from './events/track';
import { UpdateUsers } from './events/update-users';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    DatabaseModule,
  ],
  providers: [
    DiscordHelperService,

    LeaderboardCommand,

    IntroMusic,
    Track,
    CreateWitnessedGuilds,
    UpdateUsers,
  ],
})
export class BotModule {}

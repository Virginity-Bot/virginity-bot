import { DiscordModule } from '@discord-nestjs/core';
import { forwardRef, Module } from '@nestjs/common';
import { DiscordConfigService } from 'src/bot/discord-config.service';
import { DatabaseModule } from 'src/database/database.module';
import { LeaderboardCommand } from './commands/leaderboard.command';

import { DiscordHelperService } from './discord-helper.service';
import { UpdatedGuilds } from './events/update-guilds';
import { IntroMusic } from './events/intro-music';
import { Track } from './events/track';
import { UpdateUsers } from './events/update-users';
import { LeaderboardService } from './leaderboard.service';
import { ScoreCommand } from './commands/score.command';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    forwardRef(() => DatabaseModule),
  ],
  providers: [
    DiscordHelperService,
    LeaderboardService,

    LeaderboardCommand,
    ScoreCommand,

    IntroMusic,
    Track,
    UpdatedGuilds,
    UpdateUsers,
  ],
  exports: [
    DiscordModule.forFeature(),
    DiscordHelperService,
    LeaderboardService,
  ],
})
export class BotModule {}

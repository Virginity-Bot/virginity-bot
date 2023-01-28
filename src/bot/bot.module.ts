import { DiscordModule } from '@discord-nestjs/core';
import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { DiscordConfigService } from 'src/bot/discord-config.service';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { DiscordHelperService } from './discord-helper.service';
import { UpdatedGuilds } from './events/update-guilds';
import { IntroMusic } from './events/intro-music';
import { Track } from './events/track';
import { UpdateUsers } from './events/update-users';
import { LeaderboardService } from './leaderboard.service';
import { SettingsService } from './commands/settings.service';
import { LeaderboardCommand } from './commands/leaderboard.command';
import { CheckScoreCommand } from './commands/check-score.command';
import { SettingsCommand } from './commands/settings.command';

@Module({
  imports: [
    HttpModule,
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    forwardRef(() => DatabaseModule),
    StorageModule,
  ],
  providers: [
    DiscordHelperService,
    LeaderboardService,
    SettingsService,

    LeaderboardCommand,
    CheckScoreCommand,
    SettingsCommand,

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

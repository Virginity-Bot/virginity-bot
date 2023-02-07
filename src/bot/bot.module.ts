import { DiscordModule } from '@discord-nestjs/core';
import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { DiscordConfigService } from 'src/bot/discord-config.service';
import { DiscordHelperService } from './discord-helper.service';
import { UpdatedGuilds } from './events/update-guilds';
import { IntroMusic } from './events/intro-music';
import { Track } from './events/track';
import { UpdateUsers } from './events/update-users';
import { LeaderboardService } from './leaderboard.service';
import { SettingsService } from './commands/settings.service';
import { AudioService } from './audio.service';
import { LeaderboardCommand } from './commands/leaderboard.command';
import { CheckScoreCommand } from './commands/check-score.command';
import { SettingsCommand } from './commands/settings.command';
import { GuildSettingsCommand } from './commands/guild-settings.command';
import { GuildAdminGuard } from './guards/guild-admin.guard';

@Module({
  imports: [
    HttpModule,
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    forwardRef(() => DatabaseModule),
    StorageModule,
    forwardRef(() => SchedulingModule),
  ],
  providers: [
    DiscordHelperService,
    LeaderboardService,
    SettingsService,
    AudioService,

    LeaderboardCommand,
    CheckScoreCommand,
    SettingsCommand,
    GuildSettingsCommand,

    IntroMusic,
    Track,
    UpdatedGuilds,
    UpdateUsers,

    GuildAdminGuard,
  ],
  exports: [
    DiscordModule.forFeature(),
    DiscordHelperService,
    LeaderboardService,
  ],
})
export class BotModule {}

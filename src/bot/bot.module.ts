import { DiscordModule } from '@discord-nestjs/core';
import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { SchedulingModule } from 'src/scheduling/scheduling.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';
import { DiscordConfigService } from 'src/bot/discord-config.service';
import { PrometheusModule } from 'src/prometheus/prometheus.module';
import { DiscordHelperService } from './discord-helper.service';
import { UpdatedGuilds } from './events/update-guilds';
import { IntroMusic } from './events/intro-music';
import { Track } from './events/track';
import { UpdateUsers } from './events/update-users';
import { LeaderboardService } from './leaderboard.service';
import { SettingsService } from './commands/settings.service';
import { AudioService } from './audio.service';
import { RulesService } from './rules.service';
import { LeaderboardCommand } from './commands/leaderboard.command';
import { CheckScoreCommand } from './commands/check-score.command';
import { SettingsCommand } from './commands/settings.command';
import { GuildSettingsCommand } from './commands/guild-settings.command';
import { RulesCommand } from './commands/rules.command';
import { GuildAdminGuard } from './guards/guild-admin.guard';
import { TimingLogInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [
    HttpModule,
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    forwardRef(() => DatabaseModule),
    StorageModule,
    forwardRef(() => SchedulingModule),
    forwardRef(() => PrometheusModule),
  ],
  providers: [
    DiscordHelperService,
    LeaderboardService,
    SettingsService,
    AudioService,
    RulesService,

    LeaderboardCommand,
    CheckScoreCommand,
    SettingsCommand,
    GuildSettingsCommand,
    RulesCommand,

    IntroMusic,
    Track,
    UpdatedGuilds,
    UpdateUsers,

    GuildAdminGuard,

    TimingLogInterceptor,
  ],
  exports: [
    DiscordModule.forFeature(),
    DiscordHelperService,
    LeaderboardService,
  ],
})
export class BotModule {}

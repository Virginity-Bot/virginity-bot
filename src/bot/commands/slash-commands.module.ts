import { Module } from '@nestjs/common';
import { LeaderboardCommand } from './leaderboard.command';

@Module({ providers: [LeaderboardCommand] })
export class SlashCommandsModule {}

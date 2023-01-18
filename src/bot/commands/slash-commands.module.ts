import { Module } from '@nestjs/common';
import { LeaderboardCommand } from './leaderboard.command';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LeaderboardCommand],
})
export class SlashCommandsModule {}

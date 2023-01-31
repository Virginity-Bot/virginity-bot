import { forwardRef, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import config from 'src/mikro-orm.config'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
  GuildEntity,
  GuildChannelSettings,
  GuildRoleSettings,
  GuildScoreMultiplierSettings,
  GuildScoreSettings,
} from 'src/entities/guild';
import { VirginEntity } from 'src/entities/virgin.entity';
import { IntroSongEntity } from 'src/entities/intro-song.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';
import { DatabaseService } from 'src/database/database.service';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({
      entities: [
        GuildEntity,
        GuildRoleSettings,
        GuildChannelSettings,
        GuildScoreSettings,
        GuildScoreMultiplierSettings,
        VirginEntity,
        IntroSongEntity,
        VCEventEntity,
      ],
    }),
    forwardRef(() => BotModule),
  ],
  providers: [DatabaseService],
  exports: [MikroOrmModule, DatabaseService],
})
export class DatabaseModule {}

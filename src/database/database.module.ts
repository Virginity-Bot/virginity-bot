import { forwardRef, Inject, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import config from 'src/mikro-orm.config'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VirginSettingsEntity } from 'src/entities/virgin-settings.entity';
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
        VirginEntity,
        VirginSettingsEntity,
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

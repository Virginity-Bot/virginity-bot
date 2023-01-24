import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import config from 'src/mikro-orm.config'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { DatabaseService } from './database.service';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VirginSettingsEntity } from 'src/entities/virgin-settings.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({
      entities: [
        GuildEntity,
        VirginEntity,
        VirginSettingsEntity,
        VCEventEntity,
      ],
    }),
  ],
  providers: [DatabaseService],
  exports: [MikroOrmModule, DatabaseService],
})
export class DatabaseModule {}

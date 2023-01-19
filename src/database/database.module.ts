import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import config from 'src/mikro-orm.config';
import { GuildEntity } from 'src/entities/guild.entity';
import { VirginEntity } from 'src/entities/virgin.entity';
import { VCEventEntity } from 'src/entities/vc-event.entity';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({
      entities: [GuildEntity, VirginEntity, VCEventEntity],
    }),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}

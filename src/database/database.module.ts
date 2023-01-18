import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Guild } from 'src/entities/guild.entity';
import { Virgin } from 'src/entities/virgin.entity';
import { VCEvent } from 'src/entities/vc-event.entity';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    MikroOrmModule.forFeature({ entities: [Guild, Virgin, VCEvent] }),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}

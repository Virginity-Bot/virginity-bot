import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Logger } from '@nestjs/common';

import configuration from './config/configuration';

import { GuildEntity } from './entities/guild.entity';
import { VirginEntity } from './entities/virgin.entity';
import { IntroSongEntity } from './entities/intro-song.entity';
import { VCEventEntity } from './entities/vc-event.entity';
import { DeletedRecord } from './entities/deleted-record.entity';

const logger = new Logger('MikroORM');
const config: Options = {
  metadataProvider: TsMorphMetadataProvider,
  logger: Logger.log.bind(logger),

  entities: [
    GuildEntity,
    VirginEntity,
    IntroSongEntity,
    VCEventEntity,
    DeletedRecord,
  ],

  type: configuration.db.type,
  clientUrl: configuration.db.url,
  pool: {
    min: configuration.db.pool.min,
    max: configuration.db.pool.max,
  },

  cache: {
    options: { cacheDir: configuration.mikro_orm.cache_dir },
  },
};

export default config;

import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Logger } from '@nestjs/common';

import configuration from './config/configuration';

import {
  GuildChannelSettings,
  GuildEntity,
  GuildRoleSettings,
  GuildScoreMultiplierSettings,
  GuildScoreSettings,
} from './entities/guild';
import { VirginEntity } from './entities/virgin.entity';
import { IntroSongEntity } from './entities/intro-song.entity';
import { VCEventEntity } from './entities/vc-event.entity';
import { DeletedRecord } from './entities/deleted-record.entity';

const logger = new Logger('MikroORM');
const config: Options = {
  logger: Logger.log.bind(logger),

  type: configuration.db.type,
  clientUrl: configuration.db.url,
  pool: {
    min: configuration.db.pool.min,
    max: configuration.db.pool.max,
  },

  entities: [
    GuildEntity,
    GuildScoreSettings,
    GuildScoreMultiplierSettings,
    GuildRoleSettings,
    GuildChannelSettings,
    VirginEntity,
    IntroSongEntity,
    VCEventEntity,
    DeletedRecord,
  ],

  metadataProvider: TsMorphMetadataProvider,
  cache: {
    options: { cacheDir: configuration.mikro_orm.cache_dir },
  },

  populateAfterFlush: true,
};

export default config;

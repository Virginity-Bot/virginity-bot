import { LoadStrategy, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Logger } from '@nestjs/common';

import configuration, { LogLevel } from './config/configuration';

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
import { GuildIntroSettings } from './entities/guild/guild-intro.embeddable';

const logger = new Logger('MikroORM');
const debug = configuration.log.level >= LogLevel.DEBUG;

const config: Options = {
  logger: (debug ? logger.debug : logger.log).bind(logger),
  debug,

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
    GuildIntroSettings,
    VirginEntity,
    IntroSongEntity,
    VCEventEntity,
    DeletedRecord,
  ],

  metadataProvider: TsMorphMetadataProvider,
  cache: {
    options: { cacheDir: configuration.mikro_orm.cache_dir },
  },

  loadStrategy: LoadStrategy.JOINED,
  populateAfterFlush: true,

  migrations: {
    pathTs: 'src/migrations',
    path: 'dist/migrations',
  },
};

export default config;

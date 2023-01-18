import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

import configuration from './config/configuration';
import { Virgin } from './entities/virgin.entity';
import { Guild } from './entities/guild.entity';
import { VCEvent } from './entities/vc-event.entity';

const config: Options = {
  metadataProvider: TsMorphMetadataProvider,

  entities: [Virgin, Guild, VCEvent],

  type: configuration.db.type,
  clientUrl: configuration.db.url,
  pool: {
    min: configuration.db.pool.min,
    max: configuration.db.pool.max,
  },
};

export default config;

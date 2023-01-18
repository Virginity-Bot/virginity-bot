import { Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Logger } from '@nestjs/common';

import configuration from './config/configuration';
import { Virgin } from './entities/virgin.entity';
import { Guild } from './entities/guild.entity';
import { VCEvent } from './entities/vc-event.entity';

const logger = new Logger('MikroORM');
const config: Options = {
  metadataProvider: TsMorphMetadataProvider,
  logger: Logger.log.bind(logger),

  entities: [Virgin, Guild, VCEvent],

  type: configuration.db.type,
  clientUrl: configuration.db.url,
  pool: {
    min: configuration.db.pool.min,
    max: configuration.db.pool.max,
  },
};

export default config;

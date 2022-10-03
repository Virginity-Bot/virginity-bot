import { Options } from '@mikro-orm/core';
import { Virgin } from './entities/virgin-entity';
import { Guild } from './entities/guild-entity';

const options: Options = {
  entities: [Virgin],
  type: 'postgresql',
  dbName: 'postgres',
  //debug: true,
  port: 3306,
  user: 'edgar',
  password: 'password',
};

export default options;

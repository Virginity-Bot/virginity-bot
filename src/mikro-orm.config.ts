import { Options } from '@mikro-orm/core';
import { Virgin } from './entities/virgin-entity';
import * as dotenv from 'dotenv';

const options: Options = {
  entities: [Virgin],
  type: process.env.TYPE,
  clientUrl: process.env.DATABASE_URL,
};
dotenv.config();
export default options;

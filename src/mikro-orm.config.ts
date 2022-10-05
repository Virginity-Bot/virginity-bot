import { Options } from '@mikro-orm/core';
import { Virgin } from './entities/virgin-entity';
import * as dotenv from 'dotenv';

const options: Options = {
  entities: [Virgin],
  //type: process.env.TYPE,
  type: 'postgresql',
  dbName: process.env.DB_NAME,
  //port: process.env.PORT,
  port: 3306,
  user: process.env.USER,
  password: process.env.PASSWORD,
};
dotenv.config();
export default options;

import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { MikroORM } from '@mikro-orm/core';

import { AppModule } from './app.module';
import configuration from './config/configuration';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const orm = app.get(MikroORM);
  // TODO: do we actually want to do this in prod?
  await setup_db(orm);

  await app.listen(configuration.port);
}
bootstrap();

/**
 * Creates initial database schema if none exists.
 */
async function setup_db(orm: MikroORM) {
  const schema_gen = orm.getSchemaGenerator();

  await schema_gen.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // creates an empty schema?
  await schema_gen.ensureDatabase();
}

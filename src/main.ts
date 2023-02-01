import { NestFactory } from '@nestjs/core';
import { LogLevel as NestLogLevel } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { MikroORM } from '@mikro-orm/core';

import { AppModule } from './app.module';
import configuration, { LogLevel } from './config/configuration';

dotenv.config();

/**
 * Creates initial database schema if none exists.
 */
async function setup_db(orm: MikroORM) {
  const schema_gen = orm.getSchemaGenerator();

  // creates an empty schema?
  await schema_gen.ensureDatabase();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: Object.keys(LogLevel)
      .map((i) => parseInt(i))
      .filter((i) => !isNaN(i))
      .reduce((levels, curr) => {
        if (curr <= configuration.log_level) {
          switch (curr) {
            case LogLevel.QUIET:
              return [];
            case LogLevel.ERROR:
              levels.push('error');
              break;
            case LogLevel.WARN:
              levels.push('warn', 'log');
              break;
            case LogLevel.DEBUG:
              levels.push('debug', 'verbose');
              break;
          }
        }
        return levels;
      }, new Array<NestLogLevel>()),
  });
  app.enableShutdownHooks();

  const orm = app.get(MikroORM);
  // TODO: do we actually want to do this in prod?
  await setup_db(orm);

  await app.listen(configuration.port);
}

bootstrap();

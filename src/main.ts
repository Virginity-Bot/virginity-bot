import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/core';
import pluralize from 'pluralize';

import configuration from './config/configuration';
import { AppModule } from './app.module';
import { logger } from './utils/logger';
import { boldify } from './utils/logs';

/**
 * Creates initial database schema if none exists.
 */
async function setup_db(orm: MikroORM) {
  const migrator = orm.getMigrator();
  const pending_migrations = await migrator.getPendingMigrations();

  if (pending_migrations.length > 0) {
    if (configuration.db.auto_migrate) {
      await migrator.up();
    } else {
      throw new Error(
        boldify`Database is not up-to-date and auto-migration is disabled. ${
          pending_migrations.length
        } ${pluralize('migration', pending_migrations.length)} pending.`,
      );
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });
  app.enableShutdownHooks();

  const orm = app.get(MikroORM);
  // TODO: do we actually want to do this in prod?
  await setup_db(orm);

  await app.listen(configuration.port);
}

bootstrap();

import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ShardingManager } from 'discord.js';
import pluralize from 'pluralize';

import configuration from './config/configuration';
import { AppModule } from './app.module';
import { logger as NestLogger } from './utils/logger';
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
  const app = await NestFactory.create(AppModule, { logger: NestLogger });
  app.enableShutdownHooks();

  const logger = new Logger('bootstrap');

  const orm = app.get(MikroORM);
  // TODO: do we actually want to do this in prod?
  await setup_db(orm);

  const manager = new ShardingManager(join(__dirname, 'bot.js'), {
    token: 'secret', // config.get<string>('discord.bot.token')
  });

  manager.spawn();

  manager.on('shardCreate', (shard) => {
    shard.on('reconnecting', () => {
      logger.log(`Reconnecting shard: [${shard.id}]`);
    });
    shard.on('spawn', () => {
      logger.log(`Spawned shard: [${shard.id}]`);
    });
    shard.on('ready', () => {
      logger.log(` Shard [${shard.id}] is ready`);
    });
    shard.on('death', () => {
      logger.log(`Shard died: [${shard.id}]`);
    });
    shard.on('error', (err) => {
      logger.log(`Error in  [${shard.id}] with : ${err} `);
      shard.respawn();
    });
  });
}

bootstrap();

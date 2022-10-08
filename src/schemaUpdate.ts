import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql/PostgreSqlDriver';
import { Virgin } from './entities/virgin-entity';
import { EntityManager } from '@mikro-orm/postgresql';

export default async function schemaUpdate() {
  const orm = await MikroORM.init();
  const generator = orm.getSchemaGenerator();

  // there is also `generate()` method that returns drop + create queries
  //const dropAndCreateDump = await generator.generate();
  //const updateDump = await generator.getUpdateSchemaSQL();
  //console.log(dropAndCreateDump);

  // in tests it can be handy to use those:
  await generator.refreshDatabase(); // ensure db exists and is fresh
  await generator.clearDatabase(); // removes all data

  await orm.close(true);
  //}
}

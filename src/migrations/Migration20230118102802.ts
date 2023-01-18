import { Migration } from '@mikro-orm/migrations';

export class Migration20230118102602 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "deleted_record" ("id" uuid not null default uuid_generate_v4(), "deleted_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "table_name" text not null, "object_id" uuid not null, "data" jsonb not null, constraint "deleted_record_pkey" primary key ("id"));',
    );

    this.addSql(`
      CREATE FUNCTION deleted_record_insert() RETURNS trigger
          LANGUAGE plpgsql
      AS $$
          BEGIN
              EXECUTE 'INSERT INTO deleted_record (data, object_id, table_name) VALUES ($1, $2, $3)'
              USING to_jsonb(OLD.*), OLD.id, TG_TABLE_NAME;

              RETURN OLD;
          END;
      $$;
    `);

    this.addSql(`
      CREATE TRIGGER deleted_record_insert AFTER DELETE ON guild
        FOR EACH ROW EXECUTE FUNCTION deleted_record_insert();
      CREATE TRIGGER deleted_record_insert AFTER DELETE ON vc_event
        FOR EACH ROW EXECUTE FUNCTION deleted_record_insert();
      CREATE TRIGGER deleted_record_insert AFTER DELETE ON virgin
        FOR EACH ROW EXECUTE FUNCTION deleted_record_insert();
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TRIGGER deleted_record_insert ON guild;
      DROP TRIGGER deleted_record_insert ON vc_event;
      DROP TRIGGER deleted_record_insert ON virgin;
    `);

    this.addSql(`
      DROP FUNCTION deleted_record_insert();
    `);

    this.addSql('drop table if exists "deleted_record" cascade;');
  }
}

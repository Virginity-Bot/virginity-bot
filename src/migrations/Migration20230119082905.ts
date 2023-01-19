import { Migration } from '@mikro-orm/migrations';

export class Migration20230119082905 extends Migration {
  async up(): Promise<void> {
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
      CREATE TRIGGER deleted_record_insert AFTER DELETE ON virgin
        FOR EACH ROW EXECUTE FUNCTION deleted_record_insert();
      CREATE TRIGGER deleted_record_insert AFTER DELETE ON vc_event
        FOR EACH ROW EXECUTE FUNCTION deleted_record_insert();
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP FUNCTION deleted_record_insert();
    `);
  }
}

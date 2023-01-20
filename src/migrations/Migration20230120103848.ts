import { Migration } from '@mikro-orm/migrations';

export class Migration20230120103848 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "guild" add column "last_reset" timestamptz(0) not null default now();');
    this.addSql('comment on column "guild"."last_reset" is \'Timestamp when the last reset ocurred\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" drop column "last_reset";');
  }

}

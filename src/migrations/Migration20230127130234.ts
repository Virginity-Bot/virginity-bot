import { Migration } from '@mikro-orm/migrations';

export class Migration20230127130234 extends Migration {

  async up(): Promise<void> {
    // this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_virgin_snowflake_foreign";');

    this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_pkey";');
    this.addSql('alter table "virgin_settings" drop column "id";');
    // this.addSql('alter table "virgin_settings" add constraint "virgin_settings_virgin_snowflake_foreign" foreign key ("virgin_snowflake") references "virgin" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_pkey" primary key ("virgin_snowflake");');
  }

  async down(): Promise<void> {
    // this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_virgin_snowflake_foreign";');

    this.addSql('alter table "virgin_settings" add column "id" uuid not null default uuid_generate_v4();');
    this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_pkey";');
    // this.addSql('alter table "virgin_settings" add constraint "virgin_settings_virgin_snowflake_foreign" foreign key ("virgin_snowflake") references "virgin" ("id") on update cascade;');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_pkey" primary key ("id");');
  }

}

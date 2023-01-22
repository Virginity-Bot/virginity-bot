import { Migration } from '@mikro-orm/migrations';

export class Migration20230121121819 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "virgin_settings" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "virgin_snowflake" text not null, "intro_song" text not null, "title_when_leader" text not null, constraint "virgin_settings_pkey" primary key ("id"));');
    this.addSql('create index "virgin_settings_created_at_index" on "virgin_settings" ("created_at");');
    this.addSql('create index "virgin_settings_updated_at_index" on "virgin_settings" ("updated_at");');

    // this.addSql('alter table "virgin_settings" add constraint "virgin_settings_virgin_snowflake_foreign" foreign key ("virgin_snowflake") references "virgin" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "virgin_settings" cascade;');
  }

}

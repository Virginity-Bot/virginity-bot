import { Migration } from '@mikro-orm/migrations';

export class Migration20230119113820 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "deleted_record" ("id" uuid not null default uuid_generate_v4(), "deleted_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "table_name" text not null, "object_id" uuid not null, "data" jsonb not null, constraint "deleted_record_pkey" primary key ("id"));');

    this.addSql('create table "guild" ("id" text not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "name" text not null, "biggest_virgin_role_id" text null, constraint "guild_pkey" primary key ("id"));');
    this.addSql('create index "guild_id_index" on "guild" ("id");');
    this.addSql('create index "guild_created_at_index" on "guild" ("created_at");');
    this.addSql('create index "guild_updated_at_index" on "guild" ("updated_at");');

    this.addSql('create table "virgin" ("id" text not null, "guild_snowflake" text not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "username" text not null, "discriminator" text not null, "nickname" text null, "cached_dur_in_vc" int not null default 0, constraint "virgin_pkey" primary key ("id", "guild_snowflake"));');
    this.addSql('create index "virgin_id_index" on "virgin" ("id");');
    this.addSql('create index "virgin_created_at_index" on "virgin" ("created_at");');
    this.addSql('create index "virgin_updated_at_index" on "virgin" ("updated_at");');
    this.addSql('create index "virgin_username_index" on "virgin" ("username");');
    this.addSql('create index "virgin_discriminator_index" on "virgin" ("discriminator");');
    this.addSql('create index "virgin_cached_dur_in_vc_index" on "virgin" ("cached_dur_in_vc");');

    this.addSql('create table "vc_event" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "virgin_snowflake" text not null, "guild_snowflake" text not null, "connection_start" timestamptz(0) not null default now(), "connection_end" timestamptz(0) null, "screen" boolean not null default false, "camera" boolean not null default false, constraint "vc_event_pkey" primary key ("id"));');
    this.addSql('create index "vc_event_created_at_index" on "vc_event" ("created_at");');
    this.addSql('create index "vc_event_updated_at_index" on "vc_event" ("updated_at");');
    this.addSql('create index "vc_event_connection_start_index" on "vc_event" ("connection_start");');
    this.addSql('create index "vc_event_connection_end_index" on "vc_event" ("connection_end");');

    this.addSql('alter table "virgin" add constraint "virgin_guild_snowflake_foreign" foreign key ("guild_snowflake") references "guild" ("id") on update cascade;');

    this.addSql('alter table "vc_event" add constraint "vc_event_virgin_snowflake_guild_snowflake_foreign" foreign key ("virgin_snowflake", "guild_snowflake") references "virgin" ("id", "guild_snowflake") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "virgin" drop constraint "virgin_guild_snowflake_foreign";');

    this.addSql('alter table "vc_event" drop constraint "vc_event_virgin_snowflake_guild_snowflake_foreign";');

    this.addSql('drop table if exists "deleted_record" cascade;');

    this.addSql('drop table if exists "guild" cascade;');

    this.addSql('drop table if exists "virgin" cascade;');

    this.addSql('drop table if exists "vc_event" cascade;');
  }

}

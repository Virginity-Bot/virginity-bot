import { Migration } from '@mikro-orm/migrations';

export class Migration20230118102602 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "guild" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "snowflake" text not null, "name" text not null, "biggest_virgin_role_id" text null, constraint "guild_pkey" primary key ("id"));',
    );

    this.addSql(
      'create table "virgin" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "snowflake" text not null, "username" text not null, "discriminator" text not null, "guild_id" uuid not null, "cached_dur_in_vc" int not null default 0, constraint "virgin_pkey" primary key ("id"));',
    );

    this.addSql(
      'create table "vc_event" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "guild_id" uuid not null, "virgin_id" uuid not null, "connection_start" timestamptz(0) not null default now(), "connection_end" timestamptz(0) null, "screen" boolean not null default false, "camera" boolean not null default false, constraint "vc_event_pkey" primary key ("id"));',
    );

    this.addSql(
      'alter table "virgin" add constraint "virgin_guild_id_foreign" foreign key ("guild_id") references "guild" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "vc_event" add constraint "vc_event_guild_id_foreign" foreign key ("guild_id") references "guild" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "vc_event" add constraint "vc_event_virgin_id_foreign" foreign key ("virgin_id") references "virgin" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "virgin" drop constraint "virgin_guild_id_foreign";',
    );

    this.addSql(
      'alter table "vc_event" drop constraint "vc_event_guild_id_foreign";',
    );

    this.addSql(
      'alter table "vc_event" drop constraint "vc_event_virgin_id_foreign";',
    );

    this.addSql('drop table if exists "guild" cascade;');

    this.addSql('drop table if exists "virgin" cascade;');

    this.addSql('drop table if exists "vc_event" cascade;');
  }
}

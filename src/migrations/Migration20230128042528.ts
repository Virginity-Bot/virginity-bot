import { Migration } from '@mikro-orm/migrations';

export class Migration20230128042528 extends Migration {

  async up(): Promise<void> {
    this.addSql('drop table if exists "virgin_settings" cascade;');
    
    this.addSql('alter table "virgin" add column "intro_song_hash" text null, add column "title_when_leader" text null;');
    this.addSql('alter table "virgin" add constraint "virgin_intro_song_hash_foreign" foreign key ("intro_song_hash") references "intro_song" ("hash") on update cascade on delete set null;');

    this.addSql('alter table "intro_song" add column "mime_type" text not null;');
    this.addSql('comment on column "intro_song"."mime_type" is \'The MIME type of the file.\';');
  }

  async down(): Promise<void> {
    this.addSql('create table "virgin_settings" ("virgin_snowflake" text not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "intro_song_hash" text null, "title_when_leader" text null, constraint "virgin_settings_pkey" primary key ("virgin_snowflake"));');
    this.addSql('create index "virgin_settings_created_at_index" on "virgin_settings" ("created_at");');
    this.addSql('create index "virgin_settings_updated_at_index" on "virgin_settings" ("updated_at");');

    // this.addSql('alter table "virgin_settings" add constraint "virgin_settings_virgin_snowflake_foreign" foreign key ("virgin_snowflake") references "virgin" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_intro_song_hash_foreign" foreign key ("intro_song_hash") references "intro_song" ("hash") on update cascade on delete set null;');

    this.addSql('alter table "virgin" drop constraint "virgin_intro_song_hash_foreign";');

    this.addSql('alter table "virgin" drop column "intro_song_hash";');
    this.addSql('alter table "virgin" drop column "title_when_leader";');

    this.addSql('alter table "intro_song" drop column "mime_type";');
  }

}

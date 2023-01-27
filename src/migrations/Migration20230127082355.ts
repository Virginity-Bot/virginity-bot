import { Migration } from '@mikro-orm/migrations';

export class Migration20230127082355 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "intro_song" ("hash" text not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "name" text not null, "uri" text not null, constraint "intro_song_pkey" primary key ("hash"));');
    this.addSql('comment on column "intro_song"."hash" is \'The hash of uploaded audio file. Uses SHA-256.\';');
    this.addSql('comment on column "intro_song"."name" is \'The name of the intro song.\';');
    this.addSql('comment on column "intro_song"."uri" is \'Reference to an audio file. Supports s3:// and vbot-builtin:// schemas.\';');
    this.addSql('create index "intro_song_created_at_index" on "intro_song" ("created_at");');
    this.addSql('create index "intro_song_updated_at_index" on "intro_song" ("updated_at");');

    this.addSql('alter table "virgin_settings" rename column "intro_song" to "intro_song_hash";');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_intro_song_hash_foreign" foreign key ("intro_song_hash") references "intro_song" ("hash") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_intro_song_hash_foreign";');

    this.addSql('drop table if exists "intro_song" cascade;');

    this.addSql('alter table "virgin_settings" rename column "intro_song_hash" to "intro_song";');
  }

}

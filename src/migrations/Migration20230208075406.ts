import { Migration } from '@mikro-orm/migrations';

export class Migration20230208075406 extends Migration {

  async up(): Promise<void> {
    // set default to false initially to backfill pre-existing songs
    this.addSql('alter table "intro_song" add column "public" boolean not null default false;');
    // set default to true for future songs
    this.addSql(`
      ALTER TABLE "intro_song" ALTER COLUMN "public" SET DEFAULT true;
    `)
    this.addSql('comment on column "intro_song"."public" is \'Whether or not this song should be visible to other users.\';');
    this.addSql('create index "intro_song_public_index" on "intro_song" ("public");');
    this.addSql('create index "intro_song_name_index" on "intro_song" ("name");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "intro_song_public_index";');
    this.addSql('alter table "intro_song" drop column "public";');
    this.addSql('drop index "intro_song_name_index";');
  }

}

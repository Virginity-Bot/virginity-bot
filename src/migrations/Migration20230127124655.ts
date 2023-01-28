import { Migration } from '@mikro-orm/migrations';

export class Migration20230127124655 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_intro_song_hash_foreign";');

    this.addSql('alter table "virgin_settings" alter column "intro_song_hash" type text using ("intro_song_hash"::text);');
    this.addSql('alter table "virgin_settings" alter column "intro_song_hash" drop not null;');
    this.addSql('alter table "virgin_settings" alter column "title_when_leader" type text using ("title_when_leader"::text);');
    this.addSql('alter table "virgin_settings" alter column "title_when_leader" drop not null;');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_intro_song_hash_foreign" foreign key ("intro_song_hash") references "intro_song" ("hash") on update cascade on delete set null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "virgin_settings" drop constraint "virgin_settings_intro_song_hash_foreign";');

    this.addSql('alter table "virgin_settings" alter column "intro_song_hash" type text using ("intro_song_hash"::text);');
    this.addSql('alter table "virgin_settings" alter column "intro_song_hash" set not null;');
    this.addSql('alter table "virgin_settings" alter column "title_when_leader" type text using ("title_when_leader"::text);');
    this.addSql('alter table "virgin_settings" alter column "title_when_leader" set not null;');
    this.addSql('alter table "virgin_settings" add constraint "virgin_settings_intro_song_hash_foreign" foreign key ("intro_song_hash") references "intro_song" ("hash") on update cascade;');
  }

}

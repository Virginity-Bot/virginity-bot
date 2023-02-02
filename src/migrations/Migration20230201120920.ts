import { Migration } from '@mikro-orm/migrations';

export class Migration20230201120920 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "intro_song" add column "duration" interval not null, add column "computed_timeout" interval not null;');
    this.addSql('comment on column "intro_song"."duration" is \'The duration of the intro song.\';');
    this.addSql('comment on column "intro_song"."computed_timeout" is \'The length of time before next play.\';');

    this.addSql('alter table "virgin" add column "intro_last_played" timestamptz(0) null;');
    this.addSql('comment on column "virgin"."intro_last_played" is \'A timestamp for the last time an intro song was played for this user.\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "intro_song" drop column "duration";');
    this.addSql('alter table "intro_song" drop column "computed_timeout";');

    this.addSql('alter table "virgin" drop column "intro_last_played";');
  }

}

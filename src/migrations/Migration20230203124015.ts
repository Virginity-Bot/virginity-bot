import { Migration } from '@mikro-orm/migrations';

export class Migration20230203124015 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "guild" add column "score_reset_enabled" boolean not null default true;');
    this.addSql('alter table "guild" alter column "score_reset_schedule" set not null;');
    this.addSql('comment on column "guild"."score_reset_enabled" is \'Wether or not the guild has score resets enabled.\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" alter column "score_reset_schedule" drop not null;');
    this.addSql('alter table "guild" drop column "score_reset_enabled";');
  }

}

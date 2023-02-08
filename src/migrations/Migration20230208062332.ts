import { Migration } from '@mikro-orm/migrations';

export class Migration20230208062332 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "guild" add column "intro_max_duration_s" int not null default 30, add column "intro_custom_enabled" boolean not null default true;');
    this.addSql('comment on column "guild"."intro_max_duration_s" is \'The maximum duration in seconds that a custom intro song can play.\';');
    this.addSql('comment on column "guild"."intro_custom_enabled" is \'Whether or not custom intro songs should be enabled.\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" drop column "intro_max_duration_s";');
    this.addSql('alter table "guild" drop column "intro_custom_enabled";');
  }

}

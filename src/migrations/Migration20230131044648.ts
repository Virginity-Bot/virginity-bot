import { Migration } from '@mikro-orm/migrations';

export class Migration20230131044648 extends Migration {

  async up(): Promise<void> {
    this.addSql(`
      alter table "guild"
      add column "score_multipliers_stack" boolean not null default true,
      add column "score_multiplier_screen" double precision not null default 1.5,
      add column "score_multiplier_camera" double precision not null default 1.5,
      add column "score_multiplier_gaming" double precision not null default 1.5,
      add column "score_reset_schedule" text null default \'0 2 * * Tue\',
      add column "role_name" text not null default \'Chonkiest Virgin the World Has Ever Seen\',
      add column "role_color" text not null default \'#DA8C80\',
      add column "role_emoji" text not null default \'👑\',
      add column "channel_name" text not null default \'virginity-bot\',
      add column "channel_description" text not null default \'Compete with other virgins to claim the honor of being the biggest virgin.\';
    `);
    this.addSql('comment on column "guild"."score_multiplier_screen" is \'The score multiplier applied when sharing your screen in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.\';');
    this.addSql('comment on column "guild"."score_multipliers_stack" is \'Whether or not score multipliers should stack, or use the highest value.\';');
    this.addSql('comment on column "guild"."score_multiplier_camera" is \'The score multiplier applied when sharing your camera in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.\';');
    this.addSql('comment on column "guild"."score_reset_schedule" is \'When to reset a guild\'\'s scores. Uses CRON-style denotation. If null, scores will never reset.\';');
    this.addSql('comment on column "guild"."score_multiplier_gaming" is \'The score multiplier applied when gaming while in VC. This stacks with other multipliers if `score_multipliers_stack` is enabled.\';');
    this.addSql('comment on column "guild"."role_name" is \'The name of the chonkiest virgin\'\'s role in Discord.\';');
    this.addSql('comment on column "guild"."role_color" is \'The color of the chonkiest virgin\'\'s role in Discord.\';');
    this.addSql('comment on column "guild"."role_emoji" is \'An emoji to adorn the chonkiest virgin\'\'s role in Discord.\';');
    this.addSql('comment on column "guild"."channel_name" is \'The name of the virginity bot text channel in Discord.\';');
    this.addSql('comment on column "guild"."channel_description" is \'The description of the virginity bot text channel in Discord.\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" drop column "score_multiplier_screen";');
    this.addSql('alter table "guild" drop column "score_multipliers_stack";');
    this.addSql('alter table "guild" drop column "score_multiplier_camera";');
    this.addSql('alter table "guild" drop column "score_reset_schedule";');
    this.addSql('alter table "guild" drop column "score_multiplier_gaming";');
    this.addSql('alter table "guild" drop column "role_name";');
    this.addSql('alter table "guild" drop column "role_color";');
    this.addSql('alter table "guild" drop column "role_emoji";');
    this.addSql('alter table "guild" drop column "channel_name";');
    this.addSql('alter table "guild" drop column "channel_description";');
  }

}

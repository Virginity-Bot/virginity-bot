import { Migration } from '@mikro-orm/migrations';

export class Migration20230121110631 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "guild" add column "bot_channel_id" text null;');
    this.addSql(
      'comment on column "guild"."bot_channel_id" is \'ID of the virginity-bot channel\';',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" drop column "bot_channel_id";');
  }
}

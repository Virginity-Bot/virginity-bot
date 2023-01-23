import { Migration } from '@mikro-orm/migrations';

export class Migration20230123074227 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vc_event" add column "gaming" boolean not null default false;');
    this.addSql('comment on column "vc_event"."gaming" is \'Whether or not the user has a game open\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vc_event" drop column "gaming";');
  }

}

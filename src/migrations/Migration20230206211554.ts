import { Migration } from '@mikro-orm/migrations';

export class Migration20230206211554 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "vc_event" drop constraint "vc_event_virgin_snowflake_guild_snowflake_foreign";');

    this.addSql('alter table "vc_event" add constraint "vc_event_virgin_snowflake_guild_snowflake_foreign" foreign key ("virgin_snowflake", "guild_snowflake") references "virgin" ("id", "guild_snowflake") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "vc_event" drop constraint "vc_event_virgin_snowflake_guild_snowflake_foreign";');

    this.addSql('alter table "vc_event" add constraint "vc_event_virgin_snowflake_guild_snowflake_foreign" foreign key ("virgin_snowflake", "guild_snowflake") references "virgin" ("id", "guild_snowflake") on update cascade;');
  }

}

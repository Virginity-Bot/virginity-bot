import { Migration } from '@mikro-orm/migrations';

export class Migration20230118111602 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "guild" add constraint "guild_snowflake_unique" unique ("snowflake");');
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" drop constraint "guild_snowflake_unique";');
  }

}

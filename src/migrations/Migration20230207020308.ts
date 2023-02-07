import { Migration } from '@mikro-orm/migrations';

export class Migration20230207020308 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "guild" alter column "score_reset_schedule" set default \'0 18 * * Tue\';');
    // update guilds with default value
    this.addSql(`
      UPDATE "guild"
        SET "score_reset_schedule" = '0 18 * * Tue'
        WHERE "score_reset_schedule" = '0 2 * * Tue';
    `);
  }

  async down(): Promise<void> {
    this.addSql('alter table "guild" alter column "score_reset_schedule" set default \'0 2 * * Tue\';');
    // update guilds with default value
    this.addSql(`
      UPDATE "guild"
        SET "score_reset_schedule" = '0 2 * * Tue'
        WHERE "score_reset_schedule" = '0 18 * * Tue';
    `);
  }

}

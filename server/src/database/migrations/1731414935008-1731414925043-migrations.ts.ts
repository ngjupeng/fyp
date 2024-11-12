import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1731414935008 implements MigrationInterface {
  name = '1731414925043Migrations.ts1731414935008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "google_email" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_0302014fc321b9b5a3bef2ebc28" UNIQUE ("google_email")
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "kaggle_username" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_155a0864df0491882ef85c0696b" UNIQUE ("kaggle_username")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_155a0864df0491882ef85c0696b"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "kaggle_username"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_0302014fc321b9b5a3bef2ebc28"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "google_email"
        `);
  }
}

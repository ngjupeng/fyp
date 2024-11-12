import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1731399661801 implements MigrationInterface {
  name = '1731399652417Migrations.ts1731399661801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "is_whitelist" boolean NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "whitelisted_address" text array NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "whitelisted_address"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "is_whitelist"
        `);
  }
}

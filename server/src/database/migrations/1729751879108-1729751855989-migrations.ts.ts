import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1729751879108 implements MigrationInterface {
  name = '1729751855989Migrations.ts1729751879108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "collateral_amount"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "collateral_amount" double precision NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "total_reward_amount"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "total_reward_amount" double precision NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "total_reward_amount"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "total_reward_amount" integer NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "collateral_amount"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "collateral_amount" integer NOT NULL
        `);
  }
}

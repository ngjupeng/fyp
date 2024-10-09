import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728393632059 implements MigrationInterface {
  name = '1728393618945Migrations.ts1728393632059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "address" character varying 
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_b0ec0293d53a1385955f9834d5c" UNIQUE ("address")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_b0ec0293d53a1385955f9834d5c"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "address"
        `);
  }
}

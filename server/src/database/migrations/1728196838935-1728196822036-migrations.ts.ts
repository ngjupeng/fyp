import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728196838935 implements MigrationInterface {
  name = '1728196822036Migrations.ts1728196838935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "supported_tokens"
            ADD CONSTRAINT "UQ_31c461486dbc871136df99eb20a" UNIQUE ("name")
        `);
    await queryRunner.query(`
            ALTER TABLE "supported_tokens"
            ADD CONSTRAINT "UQ_ba13ad9c8ab0ee207641fc57019" UNIQUE ("address")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "supported_tokens" DROP CONSTRAINT "UQ_ba13ad9c8ab0ee207641fc57019"
        `);
    await queryRunner.query(`
            ALTER TABLE "supported_tokens" DROP CONSTRAINT "UQ_31c461486dbc871136df99eb20a"
        `);
  }
}

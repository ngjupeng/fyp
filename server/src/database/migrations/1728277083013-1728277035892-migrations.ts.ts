import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728277083013 implements MigrationInterface {
  name = '1728277035892Migrations.ts1728277083013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."projects_status_enum" AS ENUM('PENDING', 'RUNNING', 'COMPLETED')
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "status" "public"."projects_status_enum" NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."projects_status_enum"
        `);
  }
}

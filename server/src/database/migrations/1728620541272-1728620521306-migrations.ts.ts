import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728620541272 implements MigrationInterface {
  name = '1728620521306Migrations.ts1728620541272';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
                RENAME COLUMN "flattened_parameters" TO "encrypted_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "public_key"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "g" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "n" character varying
        `);

    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP COLUMN "encrypted_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD "encrypted_parameters" text NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP COLUMN "encrypted_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD "encrypted_parameters" text array NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "address" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "n"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP COLUMN "g"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD "public_key" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
                RENAME COLUMN "encrypted_parameters" TO "flattened_parameters"
        `);
  }
}

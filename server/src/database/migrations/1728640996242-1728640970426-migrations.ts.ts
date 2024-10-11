import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728640996242 implements MigrationInterface {
  name = '1728640970426Migrations.ts1728640996242';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}

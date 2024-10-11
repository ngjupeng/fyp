import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728636470803 implements MigrationInterface {
  name = '1728636357445Migrations.ts1728636470803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP COLUMN "encrypted_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD "encrypted_parameters" text array NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP COLUMN "encrypted_parameters"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD "encrypted_parameters" text NOT NULL
        `);
  }
}

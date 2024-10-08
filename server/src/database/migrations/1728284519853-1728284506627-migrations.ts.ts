import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728284519853 implements MigrationInterface {
  name = '1728284506627Migrations.ts1728284519853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP CONSTRAINT "FK_4b86fad39217ca10aace123c7bd"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ALTER COLUMN "current_round"
            SET DEFAULT '0'
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP CONSTRAINT "REL_4b86fad39217ca10aace123c7b"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD CONSTRAINT "FK_4b86fad39217ca10aace123c7bd" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects" DROP CONSTRAINT "FK_4b86fad39217ca10aace123c7bd"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD CONSTRAINT "REL_4b86fad39217ca10aace123c7b" UNIQUE ("creator_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ALTER COLUMN "current_round" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD CONSTRAINT "FK_4b86fad39217ca10aace123c7bd" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}

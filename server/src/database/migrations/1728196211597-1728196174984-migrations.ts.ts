import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1728196211597 implements MigrationInterface {
  name = '1728196174984Migrations.ts1728196211597';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "supported_tokens" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "name" character varying NOT NULL,
                "image_url" character varying NOT NULL,
                "address" character varying NOT NULL,
                CONSTRAINT "PK_465766a4026b656d6b157853663" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "participant_submissions" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "ipfs_link" character varying NOT NULL,
                "flattened_parameters" text array NOT NULL,
                "participant_id" integer,
                "round_id" integer,
                "project_id" integer,
                CONSTRAINT "PK_998a0954fbc9e8c91dc992c2169" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "projects" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                "verification_dataset_url" character varying NOT NULL,
                "public_key" character varying NOT NULL,
                "minimum_reputation" integer NOT NULL,
                "collateral_amount" integer NOT NULL,
                "total_reward_amount" integer NOT NULL,
                "maximum_participant_allowed" integer NOT NULL,
                "maximum_rounds" integer NOT NULL,
                "current_round" integer NOT NULL,
                "agreement_address" character varying NOT NULL,
                "initial_global_model" character varying NOT NULL,
                "file_structure" jsonb NOT NULL,
                "creator_id" integer,
                CONSTRAINT "UQ_d621672b2bb84d88ed40fccbfe5" UNIQUE ("agreement_address"),
                CONSTRAINT "REL_4b86fad39217ca10aace123c7b" UNIQUE ("creator_id"),
                CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "rounds" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "round_number" integer NOT NULL,
                "global_model_ipfs_link" character varying NOT NULL,
                "project_id" integer,
                CONSTRAINT "PK_9d254884a20817016e2f877c7e7" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "projects_participants_users" (
                "projects_id" integer NOT NULL,
                "users_id" integer NOT NULL,
                CONSTRAINT "PK_e5310b10dfbde7b9babd9172067" PRIMARY KEY ("projects_id", "users_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c9878240981c1372d5c5ffd3e" ON "projects_participants_users" ("projects_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9df4165e7f021513daf26e3dc0" ON "projects_participants_users" ("users_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_a78a00605c95ca6737389f6360b"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_a78a00605c95ca6737389f6360b" UNIQUE ("referred_by_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_a78a00605c95ca6737389f6360b" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD CONSTRAINT "FK_d46d7efc7d790656c593e863d06" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD CONSTRAINT "FK_723ee33599691104eac7b89332d" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions"
            ADD CONSTRAINT "FK_a14505f7c0c3aaab2d1719963f8" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD CONSTRAINT "FK_4b86fad39217ca10aace123c7bd" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rounds"
            ADD CONSTRAINT "FK_4c1f0093cff8932c58cd4fcd8d9" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "projects_participants_users"
            ADD CONSTRAINT "FK_5c9878240981c1372d5c5ffd3e2" FOREIGN KEY ("projects_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "projects_participants_users"
            ADD CONSTRAINT "FK_9df4165e7f021513daf26e3dc0b" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "projects_participants_users" DROP CONSTRAINT "FK_9df4165e7f021513daf26e3dc0b"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects_participants_users" DROP CONSTRAINT "FK_5c9878240981c1372d5c5ffd3e2"
        `);
    await queryRunner.query(`
            ALTER TABLE "rounds" DROP CONSTRAINT "FK_4c1f0093cff8932c58cd4fcd8d9"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP CONSTRAINT "FK_4b86fad39217ca10aace123c7bd"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP CONSTRAINT "FK_a14505f7c0c3aaab2d1719963f8"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP CONSTRAINT "FK_723ee33599691104eac7b89332d"
        `);
    await queryRunner.query(`
            ALTER TABLE "participant_submissions" DROP CONSTRAINT "FK_d46d7efc7d790656c593e863d06"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_a78a00605c95ca6737389f6360b"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_a78a00605c95ca6737389f6360b"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_a78a00605c95ca6737389f6360b" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9df4165e7f021513daf26e3dc0"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5c9878240981c1372d5c5ffd3e"
        `);
    await queryRunner.query(`
            DROP TABLE "projects_participants_users"
        `);
    await queryRunner.query(`
            DROP TABLE "rounds"
        `);
    await queryRunner.query(`
            DROP TABLE "projects"
        `);
    await queryRunner.query(`
            DROP TABLE "participant_submissions"
        `);
    await queryRunner.query(`
            DROP TABLE "supported_tokens"
        `);
  }
}

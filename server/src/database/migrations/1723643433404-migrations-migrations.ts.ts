import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1723643433404 implements MigrationInterface {
  name = '1723643409909Migrations.ts1723643433404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "users_role_enum" AS ENUM('admin', 'admin-only-view', 'user')
        `);
    await queryRunner.query(`
            CREATE TYPE "users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')
        `);
    await queryRunner.query(`
            CREATE TABLE "referral_codes" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "code" character varying(8) NOT NULL,
                "times_used" integer NOT NULL DEFAULT 0,
                CONSTRAINT "UQ_adda7b9deda346ff710695f4968" UNIQUE ("code"),
                CONSTRAINT "PK_99f08e2ed9d39d8ce902f5f1f41" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "password" character varying NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "two_factor_auth_secret" character varying,
                "is_two_factor_auth_enabled" boolean NOT NULL DEFAULT false,
                "role" "users_role_enum",
                "status" "users_status_enum" NOT NULL,
                "referral_code_id" integer,
                "referred_by_id" integer,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "REL_e29dedd79dea4c8cd1ab502107" UNIQUE ("referral_code_id"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "tokens_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')
        `);
    await queryRunner.query(`
            CREATE TABLE "tokens" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token_type" "tokens_token_type_enum" NOT NULL,
                "user_id" integer NOT NULL,
                CONSTRAINT "UQ_57b0dd7af7c6a0b7d4c3fd5c464" UNIQUE ("uuid"),
                CONSTRAINT "REL_8769073e38c365f315426554ca" UNIQUE ("user_id"),
                CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "auths" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "access_token" character varying NOT NULL,
                "refresh_token" character varying NOT NULL,
                "user_id" integer NOT NULL,
                CONSTRAINT "REL_593ea7ee438b323776029d3185" UNIQUE ("user_id"),
                CONSTRAINT "PK_22fc0631a651972ddc9c5a31090" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_e29dedd79dea4c8cd1ab5021079" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_a78a00605c95ca6737389f6360b" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "auths"
            ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"
    `);
    await queryRunner.query(`
        ALTER TABLE "tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
    `);
    await queryRunner.query(`
        ALTER TABLE "users" DROP CONSTRAINT "FK_a78a00605c95ca6737389f6360b"
    `);
    await queryRunner.query(`
        ALTER TABLE "users" DROP CONSTRAINT "FK_e29dedd79dea4c8cd1ab5021079"
    `);
    await queryRunner.query(`
        DROP TABLE "auths"
    `);
    await queryRunner.query(`
        DROP TABLE "tokens"
    `);
    await queryRunner.query(`
        DROP TYPE "public"."tokens_token_type_enum"
    `);
    await queryRunner.query(`
        DROP TABLE "users"
    `);
    await queryRunner.query(`
        DROP TYPE "public"."users_status_enum"
    `);
    await queryRunner.query(`
        DROP TYPE "public"."users_role_enum"
    `);
    await queryRunner.query(`
        DROP TABLE "referral_codes"
    `);
  }
}

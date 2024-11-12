import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1731409316543 implements MigrationInterface {
  name = '1731409299877Migrations.ts1731409316543';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "providers" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "provider_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying NOT NULL,
                CONSTRAINT "UQ_e5f817b362ee59803255e347fae" UNIQUE ("provider_id"),
                CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "verifications" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL,
                "session_id" character varying NOT NULL,
                "verified" boolean NOT NULL DEFAULT false,
                "count" integer NOT NULL,
                "user_id" integer,
                "providerId" integer,
                CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "verifications"
            ADD CONSTRAINT "FK_e9a134af366776c651168916616" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "verifications"
            ADD CONSTRAINT "FK_5e5674c757e4dda8d1c33c141a3" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "verifications" DROP CONSTRAINT "FK_5e5674c757e4dda8d1c33c141a3"
        `);
    await queryRunner.query(`
            ALTER TABLE "verifications" DROP CONSTRAINT "FK_e9a134af366776c651168916616"
        `);
    await queryRunner.query(`
            DROP TABLE "verifications"
        `);
    await queryRunner.query(`
            DROP TABLE "providers"
        `);
  }
}

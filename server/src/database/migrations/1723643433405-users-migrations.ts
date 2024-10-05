import { MigrationInterface, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import * as bcrypt from 'bcrypt';
import { APP } from '../../common/constants';

export class Migrationsts1723643433405 implements MigrationInterface {
  name = '1723643409909Migrations.ts1723643433405';
  private readonly adminEmail: string;
  private readonly adminPassword: string;
  private readonly configService: ConfigService;
  constructor() {
    this.configService = new ConfigService();
    this.adminEmail = this.configService.get<string>(
      ConfigNames.ADMIN_EMAIL,
      'admin@gmail.com',
    );
    this.adminPassword = this.configService.get<string>(
      ConfigNames.ADMIN_PASSWORD,
      'Admin@Q3Labs0',
    );
    this.adminPassword = bcrypt.hashSync(this.adminPassword, 12);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // insert dummy referral code
    await queryRunner.query(`
              INSERT INTO "referral_codes" ("created_at", "updated_at", "code")
              VALUES (NOW(), NOW(), 'LZGTSLJI')
          `);

    // add admin user to users table
    await queryRunner.query(`
              INSERT INTO "users" ("created_at", "updated_at", "password", "name", "email", "role", "status", "referral_code_id")
              VALUES (NOW(), NOW(), '${
                this.adminPassword
              }', '${APP.toUpperCase()} Admin', '${
                this.adminEmail
              }', 'admin', 'ACTIVE', 1)
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
              DELETE FROM "users" WHERE "email" = '${this.adminEmail}'
          `);
  }
}

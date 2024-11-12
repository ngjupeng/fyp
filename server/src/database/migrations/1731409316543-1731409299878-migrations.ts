import { ConfigService } from '@nestjs/config';
import { ConfigNames } from 'src/common/config/env';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrationsts1731409316578 implements MigrationInterface {
  name = '1731409299877Migrations.ts1731409316578';

  private readonly configService: ConfigService;
  private readonly supportedProviderIds: string[];
  private readonly supportedProviderNames: string[];
  private readonly supportedProviderDescriptions: string[];

  constructor() {
    this.configService = new ConfigService();
    this.supportedProviderIds = this.configService
      .get<string>(ConfigNames.DEFAULT_SUPPORTED_PROVIDERS_ID)
      .split(',');
    this.supportedProviderNames = this.configService
      .get<string>(ConfigNames.DEFAULT_SUPPORTED_PROVIDERS_NAME)
      .split(',');
    this.supportedProviderDescriptions = this.configService
      .get<string>(ConfigNames.DEFAULT_SUPPORTED_PROVIDERS_DESCRIPTION)
      .split(',');
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (let i = 0; i < this.supportedProviderIds.length; i++) {
      await queryRunner.query(`
                      INSERT INTO "providers" ("created_at", "updated_at", "provider_id", "name", "description")
                        VALUES (NOW(), NOW(), '${this.supportedProviderIds[i]}', '${this.supportedProviderNames[i]}', '${this.supportedProviderDescriptions[i]}')
                    `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

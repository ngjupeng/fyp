import { Injectable, Logger } from '@nestjs/common';
import { SupportedTokenRepository } from './supported-token.repository';
import { CreateSupportTokenDto } from './supported-token.dto';
import { SupportedTokenEntity } from './supported-token.entity';

@Injectable()
export class SupportedTokenService {
  private readonly logger = new Logger(SupportedTokenService.name);
  constructor(private readonly tokenRepository: SupportedTokenRepository) {}

  public async createToken(body: CreateSupportTokenDto): Promise<void> {
    await this.tokenRepository.create(body);
  }

  public async findAllTokens(): Promise<SupportedTokenEntity[]> {
    return this.tokenRepository.find({});
  }
}

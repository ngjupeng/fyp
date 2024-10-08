import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupportedTokenRepository } from './supported-token.repository';
import { CreateSupportTokenDto } from './supported-token.dto';
import { SupportedTokenEntity } from './supported-token.entity';
import { isAddress } from 'viem';
import { isURL } from 'class-validator';

@Injectable()
export class SupportedTokenService {
  private readonly logger = new Logger(SupportedTokenService.name);
  constructor(
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {}

  public async createToken(body: CreateSupportTokenDto): Promise<void> {
    // first check if the token already exists
    const token = await this.supportedTokenRepository.findOne({
      address: body.address,
    });
    if (token) {
      throw new BadRequestException('Supported token already exists');
    }

    // check if the address is a valid address
    if (!isAddress(body.address)) {
      throw new BadRequestException('Invalid address');
    }

    // check if image url is a valid url
    if (!isURL(body.imageUrl)) {
      throw new BadRequestException('Invalid image url');
    }

    await this.supportedTokenRepository.create(body);
  }

  public async findAllTokens(): Promise<SupportedTokenEntity[]> {
    return this.supportedTokenRepository.find({});
  }

  public async isSupported(address: string): Promise<boolean> {
    const token = await this.supportedTokenRepository.findOne({ address });
    return !!token;
  }
}

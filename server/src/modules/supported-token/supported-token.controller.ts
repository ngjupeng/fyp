import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSupportTokenDto } from './supported-token.dto';
import { SupportedTokenService } from './supported-token.service';
import { SupportedTokenEntity } from './supported-token.entity';

@ApiBearerAuth()
@ApiTags('Supported Token')
@Controller('/supported-token')
export class SupportedTokenController {
  constructor(private readonly supportedTokenService: SupportedTokenService) {}

  @ApiOperation({ summary: 'Create a new supported token' })
  @ApiResponse({ status: 201, description: 'Token created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/create')
  public async createSupportedToken(
    @Body() body: CreateSupportTokenDto,
  ): Promise<void> {
    return this.supportedTokenService.createToken(body);
  }

  @ApiOperation({ summary: 'Get all supported tokens' })
  @ApiResponse({ status: 200, description: 'Tokens fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/all')
  public async getAllTokens(): Promise<SupportedTokenEntity[]> {
    return this.supportedTokenService.findAllTokens();
  }
}

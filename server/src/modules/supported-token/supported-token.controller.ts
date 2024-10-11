import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSupportTokenDto } from './supported-token.dto';
import { SupportedTokenService } from './supported-token.service';
import { SupportedTokenEntity } from './supported-token.entity';
import { JwtAuthGuard, RoleGuard } from 'src/common/guards';
import { Role } from 'src/common/enums/role';
import { Roles } from 'src/common/decorators/roles';

@ApiBearerAuth()
@ApiTags('Supported Token')
@Controller('/supported-token')
export class SupportedTokenController {
  constructor(private readonly supportedTokenService: SupportedTokenService) {}

  @ApiOperation({ summary: 'Create a new supported token' })
  @ApiResponse({ status: 201, description: 'Token created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([Role.ADMIN])
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

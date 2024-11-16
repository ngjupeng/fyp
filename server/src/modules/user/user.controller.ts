import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Patch,
  Put,
  Body,
  Post,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/interfaces';
import { RoleGuard } from '../../common/guards/role.user';
import { Role } from '../../common/enums/role';
import { Roles } from '../../common/decorators/roles';
import { UserWithoutSecretDto } from './user.response.dto';
import { BindAddressDto } from './user.dto';
import {
  RequestProofResponseDto,
  VerificationCallbackDto,
} from './verification.dto';
import { Public } from '../../common/decorators';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/info')
  @ApiOperation({
    summary: 'User Information',
    description: 'Retrieve information about the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'isExtend', required: false, type: Boolean })
  public async info(
    @Query('isExtend') isExtend = true,
    @Request() req: RequestWithUser,
  ): Promise<UserWithoutSecretDto> {
    return this.userService.getById(req.user.id, isExtend);
  }

  @Roles([Role.ADMIN])
  @Get('/admin/info')
  @ApiOperation({
    summary: 'Get Any User Information',
    description:
      'Retrieve information about a specific user by by id, requires admin role',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'isExtend', required: false, type: Boolean })
  public async infoAdmin(
    @Query('id') id: number,
    @Query('isExtend') isExtend = true,
  ): Promise<UserWithoutSecretDto> {
    return this.userService.getById(id, isExtend);
  }

  // bind address to user
  @Patch('/bind-address')
  @ApiOperation({
    summary: 'Bind Address to User',
    description: 'Bind an address to the authenticated user',
  })
  @ApiBody({ type: BindAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address bound to user',
  })
  @ApiResponse({
    status: 400,
    description: 'Address already bound to another user',
  })
  public async bindAddress(
    @Request() req: RequestWithUser,
    @Body() body: BindAddressDto,
  ): Promise<void> {
    return this.userService.bindAddress(req.user, body.address);
  }

  @Post('/request-proofs')
  @ApiOperation({
    summary:
      'Request a proof with chosen provider, user must provide address and signature to request proof',
  })
  @ApiResponse({
    status: 201,
    type: RequestProofResponseDto,
  })
  @ApiQuery({
    name: 'providerId',
    required: true,
  })
  @ApiQuery({
    name: 'address',
    required: true,
  })
  public async requestProof(
    @Query('address') address: string,
    @Query('providerId') providerId: string,
  ): Promise<RequestProofResponseDto> {
    return this.userService.requestProof(address, providerId);
  }

  // @follow-up: only allow verification server to call this endpoint
  @Post('/callback')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Only call by verification server when the proof was verified',
  })
  @ApiBody({ type: VerificationCallbackDto })
  @Public()
  public async verificationCallback(@Req() req: VerificationCallbackDto) {
    console.log(req);
    return this.userService.verificationCallback(req.body);
  }
}

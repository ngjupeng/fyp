import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Patch,
  Put,
  Body,
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

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles([Role.ADMIN, Role.ADMINONLYVIEW])
  @Get('/admin/list')
  @ApiOperation({
    summary: 'List Users',
    description:
      'Retrieve a list of users, requires admin or admin view-only role',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'ids', required: false, type: String })
  @ApiQuery({ name: 'isExtend', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Retrieved list of users',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  public async list(
    @Query('page') page = 0,
    @Query('isExtend') isExtend = true,
    @Query('limit') limit = 10,
    @Query('ids') ids = '',
  ): Promise<UserWithoutSecretDto[]> {
    return this.userService.list(page, limit, isExtend, ids, false);
  }

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

  @Patch('/admin/update-role')
  @Roles([Role.ADMIN])
  @ApiOperation({
    summary: 'Update User Role',
    description: 'Update the role of a user by id, requires admin role',
  })
  @ApiQuery({ name: 'id', required: true, type: Number })
  @ApiQuery({ name: 'isRemove', required: false, type: Boolean })
  @ApiQuery({ name: 'role', required: true, enum: Role })
  @ApiResponse({
    status: 200,
    description: 'Role Set Successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  public async updateRole(
    @Request() req: RequestWithUser,
    @Query('id') id: number,
    @Query('isRemove') isRemove: boolean = false,
    @Query('role') role: Role,
  ): Promise<void> {
    return this.userService.updateRole(req.user, id, role, isRemove);
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
}

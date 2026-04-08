import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminUsersService } from '../services/admin-users.service';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from '../dto/user-manage.dto';
import { AdminGuard } from '../guards/admin.guard';
import {
  UserProfileDto,
  UserListResponse,
} from '../../../common/dto/responses/user.response.dto';

@ApiExtraModels(UserProfileDto)
@ApiTags('管理后台 - 用户管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiOperation({
    summary: '获取用户列表（管理端）',
    operationId: 'getAdminUsers',
  })
  @ApiOkResponse({ type: UserListResponse, description: '用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @Get('users')
  async getUsers(@Query() query: UserManageQueryDto) {
    return this.adminUsersService.getUsers(query);
  }

  @ApiOperation({
    summary: '获取用户详情（管理端）',
    operationId: 'getAdminUserById',
  })
  @ApiOkResponse({ type: UserProfileDto, description: '用户详情' })
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.getUserById(id);
  }

  @ApiOperation({ summary: '创建用户', operationId: 'createAdminUser' })
  @ApiCreatedResponse({ type: UserProfileDto, description: '创建的用户' })
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @ApiOperation({ summary: '更新用户', operationId: 'updateAdminUser' })
  @ApiOkResponse({ type: UserProfileDto, description: '更新后的用户' })
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminUsersService.updateUser(id, dto);
  }

  @ApiOperation({ summary: '删除用户', operationId: 'deleteAdminUser' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.deleteUser(id);
  }

  @ApiOperation({
    summary: '更新用户状态',
    operationId: 'updateAdminUserStatus',
  })
  @ApiOkResponse({ type: UserProfileDto, description: '更新后的用户' })
  @ApiParam({ name: 'id', type: Number, description: '用户 ID' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, dto);
  }
}

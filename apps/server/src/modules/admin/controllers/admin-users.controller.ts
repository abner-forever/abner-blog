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
import { ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from '../services/admin-users.service';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from '../dto/user-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('users')
  async getUsers(@Query() query: UserManageQueryDto) {
    return this.adminUsersService.getUsers(query);
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.getUserById(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminUsersService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.deleteUser(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, dto);
  }
}

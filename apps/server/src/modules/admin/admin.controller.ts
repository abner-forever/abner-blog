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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/login.dto';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user-manage.dto';
import {
  BlogManageQueryDto,
  AdminUpdateBlogDto,
  ToggleBlogPublishDto,
} from './dto/blog-manage.dto';
import {
  CommentManageQueryDto,
  BatchDeleteCommentsDto,
} from './dto/comment-manage.dto';
import { SearchMomentDto } from '../../moments/dto/search-moment.dto';
import { UpdateMomentDto } from '../../moments/dto/update-moment.dto';
import {
  TopicManageQueryDto,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from './dto/topic-manage.dto';
import {
  GetDailyViewsQueryDto,
  DailyViewItemDto,
  ViewType,
} from './dto/dashboard-manage.dto';
import {
  CreateSystemAnnouncementDto,
  SystemAnnouncementQueryDto,
  UpdateSystemAnnouncementDto,
} from './dto/system-announcement-manage.dto';
import { AdminGuard } from './guards/admin.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';

@ApiTags('管理后台')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 初始化管理员（开发环境）
  @ApiOperation({ summary: '初始化管理员' })
  @Post('init-admin')
  async initAdmin() {
    return this.adminService.initAdmin();
  }

  // 认证
  @Post('auth/login')
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
  }

  @UseGuards(AdminGuard)
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('auth/profile')
  async getProfile(@CurrentAdmin('userId') userId: number) {
    return this.adminService.getProfile(userId);
  }

  // 仪表盘
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('dashboard/moments-stats')
  async getMomentsStats() {
    return this.adminService.getMomentsStats();
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('dashboard/daily-views')
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ViewType,
    description: '访问类型：pv=页面浏览量, uv=独立访客, all=全部',
    default: ViewType.ALL,
  })
  async getDailyViews(
    @Query() query: GetDailyViewsQueryDto,
  ): Promise<DailyViewItemDto[]> {
    return this.adminService.getDailyViews(query.type);
  }

  // 话题管理
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('topics')
  async getTopics(@Query() query: TopicManageQueryDto) {
    return this.adminService.getTopics(query);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('topics')
  async createTopic(@Body() dto: AdminCreateTopicDto) {
    return this.adminService.createTopic(dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('topics/:id')
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.adminService.updateTopic(id, dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('topics/:id')
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTopic(id);
  }

  // 博客评论
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('comments/blog')
  async getBlogComments(@Query() query: CommentManageQueryDto) {
    return this.adminService.getBlogComments(query);
  }

  // 闲聊评论
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('comments/topic')
  async getTopicComments(@Query() query: CommentManageQueryDto) {
    return this.adminService.getTopicComments(query);
  }

  // 用户管理
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('users')
  async getUsers(@Query() query: UserManageQueryDto) {
    return this.adminService.getUsers(query);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  // 博客管理
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('blogs')
  async getBlogs(@Query() query: BlogManageQueryDto) {
    return this.adminService.getBlogs(query.transform());
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('blogs/:id')
  async getBlogById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getBlogById(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('blogs/:id')
  async updateBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateBlogDto,
  ) {
    return this.adminService.updateBlog(id, dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('blogs/:id')
  async deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteBlog(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('blogs/:id/publish')
  async toggleBlogPublish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleBlogPublishDto,
  ) {
    return this.adminService.toggleBlogPublish(id, dto.isPublished);
  }

  // 闲聊管理
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('moments')
  async getMoments(@Query() query: SearchMomentDto) {
    return this.adminService.getMoments(query);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('moments/:id')
  async getMomentById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getMomentById(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('moments/:id')
  async updateMoment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMomentDto,
  ) {
    return this.adminService.updateMoment(id, dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('moments/:id')
  async deleteMoment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMoment(id);
  }

  // 评论管理
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('comments')
  async getComments(@Query() query: CommentManageQueryDto) {
    return this.adminService.getComments(query);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteComment(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('comments/batch-delete')
  async batchDeleteComments(@Body() dto: BatchDeleteCommentsDto) {
    return this.adminService.batchDeleteComments(dto);
  }

  // 系统通知（图文）
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('system-announcements')
  async getSystemAnnouncements(@Query() query: SystemAnnouncementQueryDto) {
    return this.adminService.getSystemAnnouncements(query);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('system-announcements')
  async createSystemAnnouncement(@Body() dto: CreateSystemAnnouncementDto) {
    return this.adminService.createSystemAnnouncement(dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('system-announcements/:id')
  async getSystemAnnouncementById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSystemAnnouncementById(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Patch('system-announcements/:id')
  async updateSystemAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemAnnouncementDto,
  ) {
    return this.adminService.updateSystemAnnouncement(id, dto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Delete('system-announcements/:id')
  async deleteSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteSystemAnnouncement(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('system-announcements/:id/publish')
  async publishSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.publishSystemAnnouncement(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('system-announcements/:id/recall')
  async recallSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.recallSystemAnnouncement(id);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Post('system-announcements/:id/sync-notifications')
  async syncSystemAnnouncementNotifications(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.syncSystemAnnouncementNotifications(id);
  }
}

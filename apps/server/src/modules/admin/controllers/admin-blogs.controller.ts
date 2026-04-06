import {
  Controller,
  Get,
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
  ApiExtraModels,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminBlogsService } from '../services/admin-blogs.service';
import {
  BlogManageQueryDto,
  AdminUpdateBlogDto,
  ToggleBlogPublishDto,
} from '../dto/blog-manage.dto';
import { AdminGuard } from '../guards/admin.guard';
import {
  BlogListResponseDto,
  BlogDto,
} from '../../../common/dto/responses/blog.response.dto';

@ApiExtraModels(BlogListResponseDto, BlogDto)
@ApiTags('管理后台 - 博客管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminBlogsController {
  constructor(private readonly adminBlogsService: AdminBlogsService) {}

  @ApiOperation({
    summary: '获取博客列表（管理端）',
    operationId: 'getAdminBlogs',
  })
  @ApiOkResponse({ type: BlogListResponseDto, description: '博客列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @Get('blogs')
  async getBlogs(@Query() query: BlogManageQueryDto) {
    return this.adminBlogsService.getBlogs(query.transform());
  }

  @ApiOperation({
    summary: '获取博客详情（管理端）',
    operationId: 'getAdminBlogById',
  })
  @ApiOkResponse({ type: BlogDto, description: '博客详情' })
  @ApiParam({ name: 'id', type: Number, description: '博客 ID' })
  @Get('blogs/:id')
  async getBlogById(@Param('id', ParseIntPipe) id: number) {
    return this.adminBlogsService.getBlogById(id);
  }

  @ApiOperation({ summary: '更新博客', operationId: 'updateAdminBlog' })
  @ApiOkResponse({ type: BlogDto, description: '更新后的博客' })
  @ApiParam({ name: 'id', type: Number, description: '博客 ID' })
  @Patch('blogs/:id')
  async updateBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateBlogDto,
  ) {
    return this.adminBlogsService.updateBlog(id, dto);
  }

  @ApiOperation({ summary: '删除博客', operationId: 'deleteAdminBlog' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '博客 ID' })
  @Delete('blogs/:id')
  async deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.adminBlogsService.deleteBlog(id);
  }

  @ApiOperation({
    summary: '切换博客发布状态',
    operationId: 'toggleAdminBlogPublish',
  })
  @ApiOkResponse({ type: BlogDto, description: '更新后的博客' })
  @ApiParam({ name: 'id', type: Number, description: '博客 ID' })
  @Patch('blogs/:id/publish')
  async toggleBlogPublish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleBlogPublishDto,
  ) {
    return this.adminBlogsService.toggleBlogPublish(id, dto.isPublished);
  }
}

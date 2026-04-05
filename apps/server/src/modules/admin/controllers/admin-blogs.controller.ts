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
import { ApiTags } from '@nestjs/swagger';
import { AdminBlogsService } from '../services/admin-blogs.service';
import {
  BlogManageQueryDto,
  AdminUpdateBlogDto,
  ToggleBlogPublishDto,
} from '../dto/blog-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminBlogsController {
  constructor(private readonly adminBlogsService: AdminBlogsService) {}

  @Get('blogs')
  async getBlogs(@Query() query: BlogManageQueryDto) {
    return this.adminBlogsService.getBlogs(query.transform());
  }

  @Get('blogs/:id')
  async getBlogById(@Param('id', ParseIntPipe) id: number) {
    return this.adminBlogsService.getBlogById(id);
  }

  @Patch('blogs/:id')
  async updateBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateBlogDto,
  ) {
    return this.adminBlogsService.updateBlog(id, dto);
  }

  @Delete('blogs/:id')
  async deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.adminBlogsService.deleteBlog(id);
  }

  @Patch('blogs/:id/publish')
  async toggleBlogPublish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleBlogPublishDto,
  ) {
    return this.adminBlogsService.toggleBlogPublish(id, dto.isPublished);
  }
}

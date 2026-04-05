import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Request,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  BlogDto,
  BlogListResponseDto,
} from '../common/dto/responses/blog.response.dto';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { SearchBlogDto } from './dto/search-blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建博客' })
  @ApiResponse({ status: 201, type: BlogDto, description: '创建成功' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createBlogDto: CreateBlogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.blogsService.create(createBlogDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取推荐博客列表' })
  @ApiResponse({ status: 200, type: [BlogDto], description: '推荐博客列表' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('recommended')
  async getRecommended(@Req() req: AuthenticatedRequest): Promise<BlogDto[]> {
    const userId = req.user?.userId;
    return await this.blogsService.getRecommended(userId);
  }

  @ApiOperation({ summary: '获取博客列表' })
  @ApiResponse({
    status: 200,
    type: BlogListResponseDto,
    description: '博客分页列表',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(
    @Query() searchDto: SearchBlogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return await this.blogsService.findAll(searchDto, userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取我的博客列表' })
  @ApiResponse({ status: 200, type: [BlogDto], description: '我的博客列表' })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMyBlogs(@Req() req: AuthenticatedRequest): Promise<BlogDto[]> {
    return await this.blogsService.findByUserId(req.user.userId);
  }

  @ApiOperation({ summary: '获取博客详情' })
  @ApiParam({ name: 'id', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogDto, description: '博客详情' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    const userId = req.user?.userId;
    return this.blogsService.findOne(+id, userId, ip);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新博客' })
  @ApiParam({ name: 'id', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogDto, description: '更新后的博客' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.blogsService.update(+id, updateBlogDto, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换博客发布状态' })
  @ApiParam({ name: 'id', description: '博客 ID' })
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  togglePublish(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.blogsService.togglePublish(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除博客' })
  @ApiParam({ name: 'id', description: '博客 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.blogsService.remove(+id, req.user.userId);
  }
}

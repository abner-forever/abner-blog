import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicDetailResponse, TopicItemDto } from './dto/topic-response.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @ApiOperation({ summary: '创建话题' })
  @ApiResponse({ status: 201, type: TopicItemDto })
  @Post()
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @ApiOperation({ summary: '获取话题列表' })
  @ApiResponse({ status: 200, type: TopicItemDto, isArray: true })
  @Get()
  findAll() {
    return this.topicsService.findAll();
  }

  @ApiOperation({ summary: '获取热门话题列表' })
  @ApiResponse({ status: 200, type: TopicItemDto, isArray: true })
  @Get('hot')
  findHot() {
    return this.topicsService.findHot();
  }

  @ApiOperation({ summary: '获取话题详情（包含笔记列表）' })
  @ApiParam({ name: 'id', description: '话题 ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiResponse({ status: 200, type: TopicDetailResponse })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    const userId = req?.user?.userId;
    return this.topicsService.findOneWithNotes(
      +id,
      pageNum,
      pageSizeNum,
      userId,
    );
  }
}

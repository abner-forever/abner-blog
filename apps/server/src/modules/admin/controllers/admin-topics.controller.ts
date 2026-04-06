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
import { AdminTopicsService } from '../services/admin-topics.service';
import {
  TopicManageQueryDto,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from '../dto/topic-manage.dto';
import { AdminGuard } from '../guards/admin.guard';
import {
  TopicDto,
  TopicListResponse,
} from '../../../common/dto/responses/moment.response.dto';

@ApiExtraModels(TopicDto)
@ApiTags('管理后台 - 话题管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminTopicsController {
  constructor(private readonly adminTopicsService: AdminTopicsService) {}

  @ApiOperation({ summary: '获取话题列表', operationId: 'getAdminTopics' })
  @ApiOkResponse({ type: TopicListResponse, description: '话题列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Get('topics')
  async getTopics(@Query() query: TopicManageQueryDto) {
    return this.adminTopicsService.getTopics(query);
  }

  @ApiOperation({ summary: '创建话题', operationId: 'createAdminTopic' })
  @ApiCreatedResponse({ type: TopicDto, description: '创建的话题' })
  @Post('topics')
  async createTopic(@Body() dto: AdminCreateTopicDto) {
    return this.adminTopicsService.createTopic(dto);
  }

  @ApiOperation({ summary: '更新话题', operationId: 'updateAdminTopic' })
  @ApiOkResponse({ type: TopicDto, description: '更新后的话题' })
  @ApiParam({ name: 'id', type: Number, description: '话题 ID' })
  @Patch('topics/:id')
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.adminTopicsService.updateTopic(id, dto);
  }

  @ApiOperation({ summary: '删除话题', operationId: 'deleteAdminTopic' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '话题 ID' })
  @Delete('topics/:id')
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.adminTopicsService.deleteTopic(id);
  }
}

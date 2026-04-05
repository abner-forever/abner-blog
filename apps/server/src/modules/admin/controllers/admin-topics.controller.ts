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
import { AdminTopicsService } from '../services/admin-topics.service';
import {
  TopicManageQueryDto,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from '../dto/topic-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminTopicsController {
  constructor(private readonly adminTopicsService: AdminTopicsService) {}

  @Get('topics')
  async getTopics(@Query() query: TopicManageQueryDto) {
    return this.adminTopicsService.getTopics(query);
  }

  @Post('topics')
  async createTopic(@Body() dto: AdminCreateTopicDto) {
    return this.adminTopicsService.createTopic(dto);
  }

  @Patch('topics/:id')
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.adminTopicsService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.adminTopicsService.deleteTopic(id);
  }
}

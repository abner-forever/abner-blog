import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CalendarEventDto } from '../common/dto/responses/calendar.response.dto';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('calendar')
@ApiBearerAuth('JWT')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: '创建日历事件' })
  @ApiResponse({ status: 201, type: CalendarEventDto })
  @Post()
  create(
    @Body() createEventDto: CreateCalendarEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.calendarService.create(createEventDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取日历事件列表' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiResponse({ status: 200, type: [CalendarEventDto] })
  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.calendarService.findAll(req.user.userId, startDate, endDate);
  }

  @ApiOperation({ summary: '获取日历事件详情' })
  @ApiParam({ name: 'id', description: '事件 ID' })
  @ApiResponse({ status: 200, type: CalendarEventDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.calendarService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: '更新日历事件' })
  @ApiParam({ name: 'id', description: '事件 ID' })
  @ApiResponse({ status: 200, type: CalendarEventDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateCalendarEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.calendarService.update(+id, updateEventDto, req.user.userId);
  }

  @ApiOperation({ summary: '删除日历事件' })
  @ApiParam({ name: 'id', description: '事件 ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.calendarService.remove(+id, req.user.userId);
  }

  @ApiOperation({ summary: '切换日历事件完成状态' })
  @ApiParam({ name: 'id', description: '事件 ID' })
  @ApiResponse({ status: 200, type: CalendarEventDto })
  @Patch(':id/toggle')
  toggleComplete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.calendarService.toggleComplete(+id, req.user.userId);
  }
}

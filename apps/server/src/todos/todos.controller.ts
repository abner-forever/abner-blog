import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  TodoDto,
  TodoListResponseDto,
} from '../common/dto/responses/todo.response.dto';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('todos')
@ApiBearerAuth('JWT')
@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @ApiOperation({ summary: '创建待办事项' })
  @ApiResponse({ status: 201, type: TodoDto })
  @Post()
  create(
    @Body() createTodoDto: CreateTodoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.todosService.create(createTodoDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取待办事项列表' })
  @ApiResponse({ status: 200, type: TodoListResponseDto })
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.todosService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: '获取待办事项详情' })
  @ApiParam({ name: 'id', description: '待办事项 ID' })
  @ApiResponse({ status: 200, type: TodoDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.todosService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: '更新待办事项' })
  @ApiParam({ name: 'id', description: '待办事项 ID' })
  @ApiResponse({ status: 200, type: TodoDto })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.todosService.update(+id, updateTodoDto, req.user.userId);
  }

  @ApiOperation({ summary: '删除待办事项' })
  @ApiParam({ name: 'id', description: '待办事项 ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.todosService.remove(+id, req.user.userId);
  }

  @ApiOperation({ summary: '切换待办事项完成状态' })
  @ApiParam({ name: 'id', description: '待办事项 ID' })
  @ApiResponse({ status: 200, type: TodoDto })
  @Patch(':id/toggle')
  toggleComplete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.todosService.toggleComplete(+id, req.user.userId);
  }
}

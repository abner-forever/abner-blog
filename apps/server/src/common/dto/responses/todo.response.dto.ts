import { ApiProperty } from '@nestjs/swagger';

export class TodoDto {
  @ApiProperty({ description: '待办事项 ID' })
  id: number;

  @ApiProperty({ description: '标题' })
  title: string;

  @ApiProperty({ required: false, nullable: true, description: '详细描述' })
  description: string | null;

  @ApiProperty({ description: '是否已完成' })
  completed: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class TodoStatsDto {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '已完成数' })
  completed: number;

  @ApiProperty({ description: '待完成数' })
  pending: number;
}

export class TodoListResponseDto {
  @ApiProperty({ type: [TodoDto], description: '待办事项列表' })
  todos: TodoDto[];

  @ApiProperty({ type: TodoStatsDto, description: '统计数据' })
  stats: TodoStatsDto;
}

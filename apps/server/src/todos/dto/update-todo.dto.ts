import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTodoDto {
  @ApiProperty({ required: false, description: '待办事项标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: '详细描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: '是否已完成' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

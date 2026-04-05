import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({ description: '待办事项标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false, description: '详细描述' })
  @IsString()
  @IsOptional()
  description?: string;
}

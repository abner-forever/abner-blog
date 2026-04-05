import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({ description: '话题名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, description: '话题描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: '话题图标' })
  @IsString()
  @IsOptional()
  icon?: string;
}

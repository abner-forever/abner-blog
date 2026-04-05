import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class CreateNoteDto {
  @ApiPropertyOptional({ description: '笔记标题' })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '笔记内容' })
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: '图片数组' })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: '视频数组' })
  @IsArray()
  @IsOptional()
  videos?: string[];

  @ApiPropertyOptional({ description: '话题ID' })
  @IsNumber()
  @IsOptional()
  topicId?: number;

  @ApiPropertyOptional({ description: '地理位置' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '视频封面图' })
  @IsString()
  @IsOptional()
  cover?: string;
}

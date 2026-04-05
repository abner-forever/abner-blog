import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMomentDto {
  @ApiProperty({ required: false, description: '沸点内容（最多1000字）' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '沸点内容不能超过1000字' })
  content?: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: '图片 URL 列表',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false, description: '话题 ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number;
}

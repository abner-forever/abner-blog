import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMomentDto {
  @ApiProperty({ description: '沸点内容（最多1000字）' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: '图片 URL 列表',
  })
  @ValidateIf((o: CreateMomentDto) => o.images !== undefined)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false, description: '话题 ID' })
  @IsNumber()
  @IsOptional()
  topicId?: number;
}

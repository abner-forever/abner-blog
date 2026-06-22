import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiProperty({ required: false, description: '模板名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: '模板分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: '缩略图 URL' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false, description: 'GrapesJS 组件 JSON' })
  @IsString()
  @IsOptional()
  components?: string;

  @ApiProperty({ required: false, description: 'HTML 预览' })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({ required: false, description: 'CSS' })
  @IsString()
  @IsOptional()
  css?: string;

  @ApiProperty({ required: false, description: '排序' })
  @IsNumber()
  @IsOptional()
  sort?: number;
}

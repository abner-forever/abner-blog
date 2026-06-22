import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiProperty({ description: 'GrapesJS 组件 JSON' })
  @IsString()
  @IsNotEmpty()
  components: string;

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

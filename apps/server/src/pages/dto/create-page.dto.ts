import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ description: '页面标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'URL 标识，唯一' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ required: false, description: 'SEO 描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, type: [String], description: 'SEO 关键词' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({ required: false, description: 'Open Graph 图片' })
  @IsString()
  @IsOptional()
  ogImage?: string;

  @ApiProperty({ required: false, description: '页面封面截图' })
  @IsString()
  @IsOptional()
  cover?: string;

  @ApiProperty({ required: false, description: '页面语言', default: 'zh-CN' })
  @IsString()
  @IsOptional()
  locale?: string;
}

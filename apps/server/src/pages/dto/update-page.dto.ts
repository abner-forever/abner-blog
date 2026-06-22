import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class UpdatePageDto {
  @ApiProperty({ required: false, description: '页面标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: 'URL 标识' })
  @IsString()
  @IsOptional()
  slug?: string;

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

  @ApiProperty({ required: false, description: '页面语言' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiProperty({ required: false, description: 'GrapesJS 生成的 HTML' })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({ required: false, description: 'GrapesJS 生成的 CSS' })
  @IsString()
  @IsOptional()
  css?: string;

  @ApiProperty({ required: false, description: 'GrapesJS 组件 JSON' })
  @IsString()
  @IsOptional()
  components?: string;
}

export class PublishPageDto {
  @ApiProperty({ description: 'GrapesJS 生成的 HTML' })
  @IsString()
  html: string;

  @ApiProperty({ description: 'GrapesJS 生成的 CSS' })
  @IsString()
  css: string;

  @ApiProperty({ description: 'GrapesJS 组件 JSON' })
  @IsString()
  components: string;

  @ApiProperty({ required: false, description: '页面封面截图' })
  @IsString()
  @IsOptional()
  cover?: string;
}

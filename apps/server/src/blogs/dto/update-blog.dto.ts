import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBlogDto {
  @ApiProperty({ required: false, description: '博客标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: '博客正文（Markdown）' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false, description: '博客摘要' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ type: [String], required: false, description: '标签列表' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false, description: '是否发布' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ required: false, nullable: true, description: '封面图片 URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Markdown 预览主题（default/github/vuepress/mk-cute/smart-blue/cyanosis）',
  })
  @IsOptional()
  @IsString()
  mdTheme?: string;
}

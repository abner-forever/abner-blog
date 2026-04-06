import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

// 排序映射：前端友好名称 -> 数据库字段和方向
const SORT_MAPPING: Record<string, { field: string; order: 'ASC' | 'DESC' }> = {
  latest: { field: 'createdAt', order: 'DESC' },
  oldest: { field: 'createdAt', order: 'ASC' },
  popular: { field: 'viewCount', order: 'DESC' },
  unpopular: { field: 'viewCount', order: 'ASC' },
  'most-liked': { field: 'likeCount', order: 'DESC' },
  'least-liked': { field: 'likeCount', order: 'ASC' },
  'most-commented': { field: 'commentCount', order: 'DESC' },
  'least-commented': { field: 'commentCount', order: 'ASC' },
};

export class BlogManageQueryDto {
  @ApiPropertyOptional({ description: '页码', type: Number })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量', type: Number })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否已发布', type: Boolean })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description:
      '排序：latest, oldest, popular, unpopular, most-liked, least-liked, most-commented, least-commented',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '排序字段', type: String })
  sortBy?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'] })
  sortOrder?: 'ASC' | 'DESC';

  transform() {
    if (this.sort && SORT_MAPPING[this.sort]) {
      const mapping = SORT_MAPPING[this.sort];
      this.sortBy = mapping.field;
      this.sortOrder = mapping.order;
    } else {
      this.sortBy = 'createdAt';
      this.sortOrder = 'DESC';
    }
    return this;
  }
}

export class AdminUpdateBlogDto {
  @ApiPropertyOptional({ description: '博客标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '博客摘要' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '博客正文（Markdown）' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '封面图片 URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ description: '是否已发布', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Markdown 预览主题' })
  @IsOptional()
  @IsString()
  mdTheme?: string;

  @ApiPropertyOptional({ description: '标签列表', type: [String] })
  @IsOptional()
  @IsString()
  tags?: string[];
}

export class ToggleBlogPublishDto {
  @ApiProperty({ description: '是否已发布', type: Boolean })
  @IsBoolean()
  isPublished: boolean;
}

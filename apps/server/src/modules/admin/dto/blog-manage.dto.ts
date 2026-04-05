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
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  @IsBoolean()
  isPublished?: boolean;

  // 排序：latest, oldest, popular, unpopular, most-liked, least-liked, most-commented, least-commented
  @IsOptional()
  @IsString()
  sort?: string;

  // 内部使用的排序字段（由 sort 转换而来）
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';

  // 转换方法
  transform() {
    // 转换 sort 参数
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
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  mdTheme?: string;

  @IsOptional()
  @IsString()
  tags?: string[];
}

export class ToggleBlogPublishDto {
  @IsBoolean()
  isPublished: boolean;
}

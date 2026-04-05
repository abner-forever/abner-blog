import { ApiProperty } from '@nestjs/swagger';

export class BlogAuthorDto {
  @ApiProperty({ description: '作者 ID' })
  id: number;

  @ApiProperty({ description: '作者用户名' })
  username: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '作者昵称（优先展示）',
  })
  nickname: string | null;

  @ApiProperty({ required: false, nullable: true, description: '作者头像 URL' })
  avatar: string | null;
}

export class BlogDto {
  @ApiProperty({ description: '博客 ID' })
  id: number;

  @ApiProperty({ description: '博客标题' })
  title: string;

  @ApiProperty({ description: '博客正文（Markdown）' })
  content: string;

  @ApiProperty({ description: '博客摘要' })
  summary: string;

  @ApiProperty({ type: [String], description: '标签列表' })
  tags: string[];

  @ApiProperty({ description: '是否已发布' })
  isPublished: boolean;

  @ApiProperty({ required: false, nullable: true, description: '封面图片 URL' })
  cover: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Markdown 预览主题',
  })
  mdTheme: string | null;

  @ApiProperty({ description: '浏览量' })
  viewCount: number;

  @ApiProperty({ description: '点赞数' })
  likesCount: number;

  @ApiProperty({ description: '收藏数' })
  favoritesCount: number;

  @ApiProperty({ description: '评论数' })
  commentCount: number;

  @ApiProperty({ required: false, description: '当前用户是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ required: false, description: '当前用户是否已收藏' })
  isFavorited: boolean;

  @ApiProperty({ type: BlogAuthorDto, description: '作者信息' })
  author: BlogAuthorDto;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class BlogListResponseDto {
  @ApiProperty({ type: [BlogDto], description: '博客列表' })
  list: BlogDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

export class ToggleLikeResponseDto {
  @ApiProperty({ description: '操作后是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ description: '当前点赞总数' })
  likesCount: number;
}

export class ToggleFavoriteResponseDto {
  @ApiProperty({ description: '操作后是否已收藏' })
  isFavorited: boolean;

  @ApiProperty({ description: '当前收藏总数' })
  favoritesCount: number;
}

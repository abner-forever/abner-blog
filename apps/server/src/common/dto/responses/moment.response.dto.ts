import { ApiProperty } from '@nestjs/swagger';

export class MomentTopicDto {
  @ApiProperty({ description: '话题 ID' })
  id: number;

  @ApiProperty({ description: '话题名称' })
  name: string;

  @ApiProperty({ required: false, nullable: true, description: '话题图标' })
  icon: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题颜色' })
  color: string | null;
}

export class MomentAuthorDto {
  @ApiProperty({ description: '用户 ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '昵称（优先展示）',
  })
  nickname: string | null;

  @ApiProperty({ required: false, nullable: true, description: '头像 URL' })
  avatar: string | null;
}

export class MomentDto {
  @ApiProperty({ description: '沸点 ID' })
  id: number;

  @ApiProperty({ description: '沸点内容' })
  content: string;

  @ApiProperty({ type: [String], description: '图片 URL 列表' })
  images: string[];

  @ApiProperty({ description: '点赞数' })
  likeCount: number;

  @ApiProperty({ description: '收藏数' })
  favoriteCount: number;

  @ApiProperty({ description: '评论数' })
  commentCount: number;

  @ApiProperty({ description: '浏览量' })
  viewCount: number;

  @ApiProperty({ required: false, description: '当前用户是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ required: false, description: '当前用户是否已收藏' })
  isFavorited: boolean;

  @ApiProperty({ type: MomentAuthorDto, description: '作者信息' })
  author: MomentAuthorDto;

  @ApiProperty({
    type: MomentTopicDto,
    required: false,
    nullable: true,
    description: '话题信息',
  })
  topic: MomentTopicDto | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class MomentListResponseDto {
  @ApiProperty({ type: [MomentDto], description: '沸点列表' })
  list: MomentDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

export class ToggleMomentLikeResponseDto {
  @ApiProperty({ description: '操作后是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ description: '当前点赞总数' })
  likeCount: number;
}

export class ToggleMomentFavoriteResponseDto {
  @ApiProperty({ description: '操作后是否已收藏' })
  isFavorited: boolean;
}

export class TopicDto {
  @ApiProperty({ description: '话题 ID' })
  id: number;

  @ApiProperty({ description: '话题名称' })
  name: string;

  @ApiProperty({ required: false, nullable: true, description: '话题描述' })
  description: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题图标' })
  icon: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题颜色' })
  color: string | null;

  @ApiProperty({ description: '沸点数量' })
  momentCount: number;

  @ApiProperty({ description: '关注数量' })
  followCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

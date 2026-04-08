import { ApiProperty } from '@nestjs/swagger';

export class TopicItemDto {
  @ApiProperty({ description: '话题 ID' })
  id: number;

  @ApiProperty({ description: '话题名称' })
  name: string;

  @ApiProperty({ required: false, nullable: true, description: '话题描述' })
  description: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题封面' })
  cover: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题图标' })
  icon: string | null;

  @ApiProperty({ required: false, nullable: true, description: '话题颜色' })
  color: string | null;

  @ApiProperty({ description: '是否系统预置话题' })
  isSystem: boolean;

  @ApiProperty({ description: '是否热门话题' })
  isHot: boolean;

  @ApiProperty({ description: '沸点数量' })
  momentCount: number;

  @ApiProperty({ description: '笔记数量' })
  noteCount: number;

  @ApiProperty({ description: '关注数量' })
  followCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class TopicDetailNoteAuthorDto {
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

export class TopicDetailNoteDto {
  @ApiProperty({ description: '笔记 ID' })
  id: number;

  @ApiProperty({ required: false, nullable: true, description: '笔记标题' })
  title: string | null;

  @ApiProperty({ description: '笔记内容' })
  content: string;

  @ApiProperty({ type: [String], description: '图片 URL 列表' })
  images: string[];

  @ApiProperty({ type: [String], description: '视频 URL 列表' })
  videos: string[];

  @ApiProperty({ required: false, nullable: true, description: '位置' })
  location: string | null;

  @ApiProperty({ required: false, nullable: true, description: '封面 URL' })
  cover: string | null;

  @ApiProperty({ description: '浏览量' })
  viewCount: number;

  @ApiProperty({ description: '点赞数' })
  likeCount: number;

  @ApiProperty({ description: '评论数' })
  commentCount: number;

  @ApiProperty({ description: '收藏数' })
  favoriteCount: number;

  @ApiProperty({ type: TopicDetailNoteAuthorDto, description: '作者信息' })
  author: TopicDetailNoteAuthorDto;

  @ApiProperty({
    type: TopicItemDto,
    required: false,
    nullable: true,
    description: '话题信息',
  })
  topic: TopicItemDto | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class TopicDetailResponse {
  @ApiProperty({ type: TopicItemDto, description: '话题详情' })
  topic: TopicItemDto;

  @ApiProperty({ type: [TopicDetailNoteDto], description: '话题下笔记列表' })
  notes: TopicDetailNoteDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

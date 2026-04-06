import { ApiProperty } from '@nestjs/swagger';
import { TopicDto } from './moment.response.dto';
import { BlogDto } from './blog.response.dto';

export class CommentAuthorDto {
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

export class ReplyToUserDto {
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
}

export class ParentCommentRefDto {
  @ApiProperty({ description: '父评论 ID' })
  id: number;
}

export class CommentDto {
  @ApiProperty({ description: '评论 ID' })
  id: number;

  @ApiProperty({ description: '评论内容' })
  content: string;

  @ApiProperty({ description: '点赞数' })
  likeCount: number;

  @ApiProperty({ required: false, description: '当前用户是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ type: CommentAuthorDto, description: '评论作者' })
  author: CommentAuthorDto;

  @ApiProperty({
    type: ReplyToUserDto,
    required: false,
    nullable: true,
    description: '被回复用户',
  })
  replyToUser: ReplyToUserDto | null;

  @ApiProperty({
    type: ParentCommentRefDto,
    required: false,
    nullable: true,
    description: '父评论引用',
  })
  parentComment: ParentCommentRefDto | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class BlogCommentDto extends CommentDto {
  @ApiProperty({ type: BlogDto, description: '博客信息' })
  blog: BlogDto | null;
}

export class BlogCommentListResponse {
  @ApiProperty({ type: [BlogCommentDto], description: '评论列表' })
  list: BlogCommentDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

export class TopicCommentDto extends CommentDto {
  @ApiProperty({ type: TopicDto, description: '话题信息' })
  topic: TopicDto;
}

export class TopicCommentListResponse {
  @ApiProperty({ type: [TopicCommentDto], description: '评论列表' })
  list: TopicCommentDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

export class AllCommentListResponse {
  @ApiProperty({
    enumName: 'CommentType',
    enum: [BlogCommentDto, TopicCommentDto],
    description: '评论列表',
  })
  list: (BlogCommentDto | TopicCommentDto)[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
export class ToggleCommentLikeResponseDto {
  @ApiProperty({ description: '操作后是否已点赞' })
  isLiked: boolean;

  @ApiProperty({ description: '当前点赞总数' })
  likeCount: number;
}

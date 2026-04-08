import { ApiProperty } from '@nestjs/swagger';

class NoteAuthorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true, required: false })
  nickname: string | null;

  @ApiProperty({ nullable: true, required: false })
  avatar: string | null;
}

class NoteTopicDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class NoteDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false, nullable: true })
  title?: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: [String] })
  videos: string[];

  @ApiProperty({ required: false, nullable: true })
  cover?: string | null;

  @ApiProperty({ required: false, nullable: true })
  location?: string | null;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  favoriteCount: number;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  isFavorited: boolean;

  @ApiProperty({ type: NoteAuthorDto })
  author: NoteAuthorDto;

  @ApiProperty({ type: NoteTopicDto, required: false, nullable: true })
  topic?: NoteTopicDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NoteListResponseDto {
  @ApiProperty({ type: [NoteDto] })
  list: NoteDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

class NestedCommentReplyToUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;
}

export class NestedCommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: NoteAuthorDto })
  author: NoteAuthorDto;

  @ApiProperty({
    type: NestedCommentReplyToUserDto,
    required: false,
    nullable: true,
  })
  replyToUser?: NestedCommentReplyToUserDto;

  @ApiProperty({ nullable: true })
  parentId: number | null;

  @ApiProperty({ type: [NestedCommentDto] })
  replies: NestedCommentDto[];
}

export class NoteFavoriteItemDto extends NoteDto {
  @ApiProperty()
  favoriteId: number;

  @ApiProperty()
  favoritedAt: Date;
}

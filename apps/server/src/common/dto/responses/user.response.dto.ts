import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ description: '用户 ID' })
  id: number;

  @ApiProperty({ description: '用户名（英文）' })
  username: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '昵称（中文优先展示）',
  })
  nickname: string | null;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ required: false, nullable: true, description: '头像 URL' })
  avatar: string | null;

  @ApiProperty({ required: false, nullable: true, description: '个人简介' })
  bio: string | null;

  @ApiProperty({ description: '账户状态', example: 'active' })
  status: string;

  @ApiProperty({ required: false, nullable: true, description: '最后登录时间' })
  lastLoginAt: Date | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'JWT 访问令牌（短期）' })
  access_token: string;

  @ApiProperty({ description: 'JWT 刷新令牌（长期，用于换取新的 access/refresh）' })
  refresh_token: string;

  @ApiProperty({ type: UserProfileDto, description: '用户信息' })
  user: UserProfileDto;
}

export class UploadImageResponseDto {
  @ApiProperty({ description: '上传后的图片 URL' })
  url: string;
}

export class UserListResponse {
  @ApiProperty({ type: [UserProfileDto], description: '用户列表' })
  list: UserProfileDto[];

  @ApiProperty({ description: '总用户数' })
  total: number;

  @ApiProperty({ description: '每页用户数' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '是否有下一页' })
  hasNextPage: boolean;

  @ApiProperty({ description: '是否有上一页' })
  hasPrevPage: boolean;
}

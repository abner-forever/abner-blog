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
  @ApiProperty({ description: 'JWT 访问令牌' })
  access_token: string;

  @ApiProperty({ type: UserProfileDto, description: '用户信息' })
  user: UserProfileDto;
}

export class UploadImageResponseDto {
  @ApiProperty({ description: '上传后的图片 URL' })
  url: string;
}

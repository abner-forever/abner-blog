import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名（3-20位字母数字）', example: 'user123' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(20, { message: '用户名不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: '用户名只能包含英文字母和数字' })
  username: string;

  @ApiProperty({
    required: false,
    description: '昵称（可选，不填则随机生成）',
    example: '小飞龙',
  })
  @IsString()
  @IsOptional()
  @MaxLength(30, { message: '昵称最长30个字符' })
  nickname?: string;

  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '密码（6-32位）', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(32, { message: '密码不能超过32个字符' })
  password: string;
}

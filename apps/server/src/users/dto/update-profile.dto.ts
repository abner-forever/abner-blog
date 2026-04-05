import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    required: false,
    description: '用户名（只能英文，修改次数有限）',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]+$/, { message: '用户名只能包含英文字母和数字' })
  @MaxLength(20, { message: '用户名最长20个字符' })
  username?: string;

  @ApiProperty({ required: false, description: '昵称（可以是中文）' })
  @IsString()
  @IsOptional()
  @MaxLength(30, { message: '昵称最长30个字符' })
  nickname?: string;

  @ApiProperty({ required: false, description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, description: '头像 URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ required: false, description: '个人简介' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '个人简介最长100个字符' })
  bio?: string;
}

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiPropertyOptional({
    description:
      '腾讯云验证码 ticket（服务端启用验证码时必填，见 GET /auth/captcha-config）',
  })
  @IsOptional()
  @IsString()
  captchaTicket?: string;

  @ApiPropertyOptional({
    description: '腾讯云验证码 randstr（服务端启用验证码时必填）',
  })
  @IsOptional()
  @IsString()
  captchaRandstr?: string;
}

export class LoginByCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '6位验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码长度必须为6位' })
  code: string;
}

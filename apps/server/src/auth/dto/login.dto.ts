import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(1, { message: '密码不能为空' })
  password: string;

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

import { ApiProperty } from '@nestjs/swagger';

export class CaptchaConfigResponseDto {
  @ApiProperty({ description: '是否启用腾讯云滑块验证码' })
  enabled: boolean;

  @ApiProperty({
    description: '验证码应用 ID（启用时返回，供前端 TJCaptcha 使用）',
    nullable: true,
    required: false,
    example: 199999164,
  })
  captchaAppId: number | null;
}

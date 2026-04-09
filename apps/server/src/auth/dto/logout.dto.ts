import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LogoutBodyDto {
  @ApiPropertyOptional({
    description:
      '刷新令牌；传入时服务端会在 Redis 中吊销该会话（建议与 access 一并提交）',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refresh_token?: string;
}

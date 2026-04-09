import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenBodyDto {
  @ApiProperty({ description: '刷新令牌（JWT）' })
  @IsString()
  @MinLength(10)
  refresh_token: string;
}

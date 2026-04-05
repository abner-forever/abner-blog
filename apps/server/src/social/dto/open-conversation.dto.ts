import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenConversationDto {
  @ApiProperty({ description: '对方用户 ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  peerUserId: number;
}

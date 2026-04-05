import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MarkDmReadThroughDto {
  @ApiProperty({ description: '已看到的最晚一条消息 ID（进入聊天可视区域）' })
  @IsInt()
  @Min(1)
  messageId: number;
}

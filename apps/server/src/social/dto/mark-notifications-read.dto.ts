import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class MarkNotificationsReadDto {
  @ApiPropertyOptional({ description: '要标记已读的通知 ID 列表' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids?: number[];

  @ApiPropertyOptional({ description: '是否全部标记已读' })
  @IsOptional()
  @IsBoolean()
  markAll?: boolean;
}

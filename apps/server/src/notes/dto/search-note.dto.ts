import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchNoteDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '话题ID' })
  @IsNumber()
  @IsOptional()
  topicId?: number;

  @ApiPropertyOptional({
    description: '排序方式: time/hot',
    enum: ['time', 'hot'],
  })
  @IsString()
  @IsOptional()
  sortBy?: 'time' | 'hot' = 'time';
}

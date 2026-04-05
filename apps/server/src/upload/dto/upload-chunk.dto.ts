import { ApiProperty } from '@nestjs/swagger';
import { IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkBodyDto {
  @ApiProperty({ description: '上传 ID（初始化时返回）' })
  @IsString()
  uploadId: string;

  @ApiProperty({ description: '分片索引（从 0 开始）' })
  @Type(() => Number)
  @Min(0)
  chunkIndex: number;

  @ApiProperty({ description: '总分片数' })
  @Type(() => Number)
  @Min(1)
  totalChunks: number;
}

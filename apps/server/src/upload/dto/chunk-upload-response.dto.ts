import { ApiProperty } from '@nestjs/swagger';

export class ChunkUploadStatusDto {
  @ApiProperty({ type: [Number], description: '已上传分片下标列表' })
  uploadedChunks: number[];

  @ApiProperty({ description: '分片总数' })
  totalChunks: number;

  @ApiProperty({ description: '上传进度（0-100）' })
  progress: number;
}

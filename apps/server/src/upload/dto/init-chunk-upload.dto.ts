import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsIn } from 'class-validator';

export type ChunkUploadKind = 'video' | 'file';

export class InitChunkUploadDto {
  @ApiProperty({
    description: '资源类型：视频或通用文件',
    enum: ['video', 'file'],
  })
  @IsIn(['video', 'file'])
  kind: ChunkUploadKind;

  @ApiPropertyOptional({
    description:
      '业务路径，如 notes、moments、common（决定 assets/video|file/{businessPath}/）',
    default: 'common',
  })
  @IsString()
  @IsOptional()
  businessPath?: string;

  @ApiProperty({ description: '文件名' })
  @IsString()
  filename: string;

  @ApiProperty({ description: '文件大小(字节)' })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({ description: '文件 MD5 hash（用于秒传）' })
  @IsString()
  @IsOptional()
  fileHash?: string;

  @ApiPropertyOptional({ description: '总分片数' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  totalChunks?: number;

  @ApiPropertyOptional({ description: '文件 MIME 类型' })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

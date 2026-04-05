import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MergeUploadDto {
  @ApiProperty({ description: '上传 ID（初始化时返回）' })
  @IsString()
  uploadId: string;
}

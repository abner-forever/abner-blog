import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNoteCollectionDto {
  @ApiProperty({ description: '收藏夹名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '收藏夹描述' })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AddNoteToCollectionDto {
  @ApiProperty({ description: '收藏夹 ID' })
  @IsNumber()
  collectionId: number;
}

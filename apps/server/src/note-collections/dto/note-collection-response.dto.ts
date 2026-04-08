import { ApiProperty } from '@nestjs/swagger';
import { NoteDto } from '../../notes/dto/note-response.dto';

export class NoteCollectionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ required: false, nullable: true })
  cover?: string | null;

  @ApiProperty()
  noteCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NoteCollectionDetailDto extends NoteCollectionDto {
  @ApiProperty({ type: [NoteDto] })
  notes: NoteDto[];
}

export class NoteCollectedResponseDto {
  @ApiProperty()
  collected: boolean;
}

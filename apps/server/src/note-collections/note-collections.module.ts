import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NoteCollection,
  NoteCollectionItem,
} from '../entities/note-collection.entity';
import { Note } from '../entities/note.entity';
import { NoteFavorite } from '../entities/note-favorite.entity';
import {
  NoteCollectionsController,
  NoteCollectionsNoteController,
} from './note-collections.controller';
import { NoteCollectionsService } from './note-collections.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NoteCollection,
      NoteCollectionItem,
      Note,
      NoteFavorite,
    ]),
  ],
  controllers: [NoteCollectionsController, NoteCollectionsNoteController],
  providers: [NoteCollectionsService],
  exports: [NoteCollectionsService],
})
export class NoteCollectionsModule {}

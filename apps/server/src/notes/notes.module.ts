import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from '../entities/note.entity';
import { NoteComment } from '../entities/note-comment.entity';
import { NoteCommentLike } from '../entities/note-comment-like.entity';
import { NoteLike } from '../entities/note-like.entity';
import { NoteFavorite } from '../entities/note-favorite.entity';
import { NoteViewLog } from '../entities/note-view-log.entity';
import { Topic } from '../entities/topic.entity';
import { NoteCollectionItem } from '../entities/note-collection.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    SocialModule,
    TypeOrmModule.forFeature([
      Note,
      NoteComment,
      NoteCommentLike,
      NoteLike,
      NoteFavorite,
      NoteCollectionItem,
      NoteViewLog,
      Topic,
    ]),
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}

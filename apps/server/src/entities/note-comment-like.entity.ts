import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { NoteComment } from './note-comment.entity';

@Entity()
@Unique(['comment', 'user'])
export class NoteCommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NoteComment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  comment: NoteComment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

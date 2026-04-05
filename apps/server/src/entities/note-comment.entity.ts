import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';
import { NoteCommentLike } from './note-comment-like.entity';

@Entity()
@Index('idx_note_comment_parent', ['parentId'])
export class NoteComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => Note, (note) => note.comments, { onDelete: 'CASCADE' })
  note: Note;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  replyToUser: User;

  @Column({ default: 0 })
  likeCount: number;

  @OneToMany(() => NoteCommentLike, (like) => like.comment)
  likes: NoteCommentLike[];

  @CreateDateColumn()
  createdAt: Date;
}

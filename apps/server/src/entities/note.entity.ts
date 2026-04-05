import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Topic } from './topic.entity';
import { NoteComment } from './note-comment.entity';
import { NoteFavorite } from './note-favorite.entity';
import { NoteLike } from './note-like.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column('text')
  content: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('simple-array', { nullable: true })
  videos: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  cover: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Topic, (topic) => topic.notes, {
    eager: true,
    nullable: true,
  })
  topic: Topic;

  @OneToMany(() => NoteComment, (comment) => comment.note)
  comments: NoteComment[];

  @OneToMany(() => NoteLike, (like) => like.note)
  likes: NoteLike[];

  @OneToMany(() => NoteFavorite, (favorite) => favorite.note)
  favorites: NoteFavorite[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

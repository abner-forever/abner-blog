import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Blog } from './blog.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Blog, (blog) => blog.comments)
  blog: Blog;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @ManyToOne(() => Comment, { nullable: true })
  parentComment?: Comment;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'CASCADE' })
  replyToUser?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

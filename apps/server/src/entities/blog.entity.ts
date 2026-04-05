import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { Favorite } from './favorite.entity';

@Entity()
@Index('idx_blog_author', ['author'])
@Index('idx_blog_published_created', ['isPublished', 'createdAt'])
@Index('idx_blog_created', ['createdAt'])
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column('text')
  summary: string;

  @Column('simple-array')
  tags: string[];

  @Column({ default: false })
  @Index()
  isPublished: boolean;

  @Column({ nullable: true, type: 'text' })
  cover: string | null;

  @Column({ nullable: true, length: 32 })
  mdTheme: string | null;

  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  @Index()
  author: User;

  @OneToMany(() => Comment, (comment) => comment.blog)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.blog)
  likes: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.blog)
  favorites: Favorite[];

  @Column({ default: 0 })
  @Index()
  viewCount: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

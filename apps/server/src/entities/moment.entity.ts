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
import { Topic } from './topic.entity';
import { MomentComment } from './moment-comment.entity';
import { MomentFavorite } from './moment-favorite.entity';
import { MomentLike } from './moment-like.entity';

@Entity()
@Index('idx_moment_author', ['author'])
@Index('idx_moment_topic', ['topic'])
@Index('idx_moment_created', ['createdAt'])
export class Moment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @Index()
  author: User;

  @ManyToOne(() => Topic, (topic) => topic.moments, {
    eager: true,
    nullable: true,
  })
  @Index()
  topic: Topic;

  @OneToMany(() => MomentComment, (comment) => comment.moment)
  comments: MomentComment[];

  @OneToMany(() => MomentLike, (like) => like.moment)
  likes: MomentLike[];

  @OneToMany(() => MomentFavorite, (favorite) => favorite.moment)
  favorites: MomentFavorite[];

  @Column({ default: 0 })
  @Index()
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

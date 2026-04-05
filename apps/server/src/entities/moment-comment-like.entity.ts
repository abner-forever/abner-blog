import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { MomentComment } from './moment-comment.entity';

@Entity()
@Unique(['user', 'comment'])
export class MomentCommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => MomentComment)
  comment: MomentComment;

  @CreateDateColumn()
  createdAt: Date;
}

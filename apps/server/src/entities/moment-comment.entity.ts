import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Moment } from './moment.entity';

@Entity()
export class MomentComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Moment, (moment) => moment.comments, { onDelete: 'CASCADE' })
  moment: Moment;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: false })
  isEdited: boolean;

  @ManyToOne(() => MomentComment, { nullable: true, onDelete: 'CASCADE' })
  parentComment?: MomentComment;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'CASCADE' })
  replyToUser?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

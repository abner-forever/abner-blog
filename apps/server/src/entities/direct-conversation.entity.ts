import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['userLow', 'userHigh'])
@Index('idx_direct_conversation_user_low', ['userLow'])
@Index('idx_direct_conversation_user_high', ['userHigh'])
export class DirectConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userLowId' })
  userLow: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userHighId' })
  userHigh: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** 用户 userLow 侧最后已读时间（用于未读条数；新建会话时写入当前时间） */
  @Column({ type: 'datetime', nullable: true })
  userLowLastReadAt: Date | null;

  /** 用户 userHigh 侧最后已读时间 */
  @Column({ type: 'datetime', nullable: true })
  userHighLastReadAt: Date | null;
}

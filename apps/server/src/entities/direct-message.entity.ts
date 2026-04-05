import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { DirectConversation } from './direct-conversation.entity';

@Entity()
@Index('idx_direct_message_conversation_created', ['conversation', 'createdAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DirectConversation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: DirectConversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column('text')
  content: string;

  @Column('simple-json', { nullable: true })
  attachments: string[] | null;

  @CreateDateColumn()
  createdAt: Date;
}

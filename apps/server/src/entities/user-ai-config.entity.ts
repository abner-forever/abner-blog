import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserAIConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @Column({ default: 'minimax' })
  provider: string;

  @Column({ default: 'MiniMax-M2.7' })
  model: string;

  @Column({ type: 'int', default: 7 })
  temperature: number;

  @Column({ type: 'int', default: 4096 })
  maxTokens: number;

  @Column({ type: 'int', default: 10 })
  contextWindow: number;

  @Column({ default: false })
  thinkingEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  thinkingBudget: number;

  @Column({ type: 'text', nullable: true })
  encryptedApiKeys: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { KnowledgeChunk } from './knowledge-chunk.entity';

export enum KnowledgeBaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('knowledge_base')
export class KnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: KnowledgeBaseStatus,
    default: KnowledgeBaseStatus.ACTIVE,
  })
  status: KnowledgeBaseStatus;

  @Column({ default: 0 })
  chunkCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  indexedAt: Date;

  @OneToMany(() => KnowledgeChunk, (chunk) => chunk.knowledgeBase)
  chunks: KnowledgeChunk[];
}

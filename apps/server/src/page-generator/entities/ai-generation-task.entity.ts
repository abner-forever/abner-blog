import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'partial';

@Entity('ai_generation_tasks')
export class AiGenerationTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 128 })
  sessionId: string;

  @Column({ type: 'text', comment: 'User description / prompt for the page' })
  prompt: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: 'Selected style theme' })
  style: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    comment: 'pending | generating | completed | failed | partial',
  })
  status: GenerationStatus;

  @Column({ type: 'json', nullable: true, comment: 'Generated page schema (root)' })
  schema: Record<string, unknown>;

  @Column({ type: 'json', nullable: true, comment: 'List of generated region info' })
  regions: Array<{ regionId: string; regionType: string; name: string; status: string }>;

  @Column({ type: 'text', nullable: true, comment: 'Error message if failed' })
  error: string;

  @Column({ type: 'int', nullable: true, comment: 'Created page ID if loaded into editor' })
  pageId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

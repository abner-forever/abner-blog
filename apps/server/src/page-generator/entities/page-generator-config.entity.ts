import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LLMProvider = 'deepseek' | 'openai' | 'anthropic';

@Entity('page_generator_configs')
export class PageGeneratorConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int' })
  userId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'deepseek',
    comment: 'LLM provider: deepseek | openai | anthropic',
  })
  provider: LLMProvider;

  @Column({ type: 'varchar', length: 512, nullable: true })
  apiKey: string;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: 'API base URL override' })
  baseUrl: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: 'Model name override' })
  model: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

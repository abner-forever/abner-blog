import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('block_templates')
@Index('idx_template_category', ['category'])
export class BlockTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, default: '' })
  category: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ type: 'longtext' })
  components: string;

  @Column({ type: 'longtext', nullable: true })
  html?: string;

  @Column({ type: 'longtext', nullable: true })
  css?: string;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

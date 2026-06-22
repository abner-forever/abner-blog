import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('pages')
@Index('idx_page_slug', ['slug'], { unique: true })
@Index('idx_page_status', ['status'])
@Index('idx_page_deleted_at', ['deletedAt'])
export class Page {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords?: string[];

  @Column({ nullable: true })
  ogImage?: string;

  @Column({ nullable: true })
  cover?: string;

  @Column({ type: 'longtext', nullable: true })
  schema: string;

  @Column({ type: 'longtext', nullable: true })
  publishedSchema?: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'varchar', length: 10, default: 'zh-CN' })
  locale: string;

  @Column({ nullable: true })
  translationGroupId?: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  reviewStatus: 'draft' | 'reviewing' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  reviewComment?: string;

  @Column({ nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

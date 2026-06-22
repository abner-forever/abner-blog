import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Page } from './page.entity';

@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageId: number;

  @Column({ length: 200 })
  pageSlug: string;

  @Column({ type: 'json' })
  fields: Record<string, string>;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page?: Page;

  @CreateDateColumn()
  createdAt: Date;
}

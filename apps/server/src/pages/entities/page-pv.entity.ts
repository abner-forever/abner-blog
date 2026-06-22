import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('page_pv')
@Index('idx_pv_page_date', ['pageId', 'date'], { unique: true })
@Index('idx_pv_page_id', ['pageId'])
export class PagePV {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 0 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;
}

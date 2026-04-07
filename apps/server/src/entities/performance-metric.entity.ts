import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('performance_metrics')
@Index(['userId', 'createdAt'])
@Index(['sessionId'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ length: 64, nullable: true })
  anonymousId: string;

  @Column({ length: 64, nullable: true })
  sessionId: string;

  @Column({ length: 2048, nullable: true })
  pageUrl: string;

  @Column({ type: 'float', nullable: true })
  lcp: number;

  @Column({ type: 'float', nullable: true })
  fid: number;

  @Column({ type: 'float', nullable: true })
  cls: number;

  @Column({ type: 'float', nullable: true })
  fcp: number;

  @Column({ type: 'float', nullable: true })
  ttfb: number;

  @Column({ type: 'float', nullable: true })
  inputDelay: number;

  @Column({ length: 32, nullable: true })
  navigationType: string;

  @Column({ length: 32, nullable: true })
  connectionType: string;

  @Column({ type: 'float', nullable: true })
  devicePixelRatio: number;

  @Column({ length: 32, nullable: true })
  viewportSize: string;

  @CreateDateColumn()
  createdAt: Date;
}

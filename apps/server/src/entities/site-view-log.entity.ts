import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['path', 'viewDate'])
export class SiteViewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string; // 页面路径，如 '/', '/blog/1'

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'date' })
  viewDate: string; // Format: YYYY-MM-DD

  @CreateDateColumn()
  createdAt: Date;
}

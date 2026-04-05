import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Blog } from './blog.entity';
import { User } from './user.entity';

@Entity()
@Index(['blogId', 'ip', 'viewDate'], { unique: true })
@Index(['blogId', 'userId', 'viewDate'], { unique: true })
export class ViewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blogId: number;

  @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
  blog: Blog;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'date' })
  viewDate: string; // Format: YYYY-MM-DD

  @CreateDateColumn()
  createdAt: Date;
}

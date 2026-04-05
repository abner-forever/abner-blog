import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Moment } from './moment.entity';
import { User } from './user.entity';

@Entity()
@Index(['momentId', 'ip', 'viewDate'], { unique: true })
@Index(['momentId', 'userId', 'viewDate'], { unique: true })
export class MomentViewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  momentId: number;

  @ManyToOne(() => Moment, { onDelete: 'CASCADE' })
  moment: Moment;

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

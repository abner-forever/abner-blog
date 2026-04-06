import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Moment } from './moment.entity';

@Entity()
@Unique(['user', 'moment'])
export class MomentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Moment, (moment) => moment.likes, { onDelete: 'CASCADE' })
  moment: Moment;

  @CreateDateColumn()
  createdAt: Date;
}

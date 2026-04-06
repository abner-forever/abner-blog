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
export class MomentFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Moment, (moment) => moment.favorites, { onDelete: 'CASCADE' })
  moment: Moment;

  @CreateDateColumn()
  createdAt: Date;
}

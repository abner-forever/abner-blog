import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum CalendarEventType {
  TODO = 'todo',
  EVENT = 'event',
  REMINDER = 'reminder',
}

@Entity()
export class CalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: CalendarEventType,
    default: CalendarEventType.EVENT,
  })
  type: CalendarEventType;

  @Column({ default: false })
  allDay: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => User, (user) => user.todos, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

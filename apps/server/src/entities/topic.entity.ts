import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Moment } from './moment.entity';
import { Note } from './note.entity';

@Entity()
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  cover: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: false })
  isHot: boolean;

  @Column({ default: 0 })
  momentCount: number;

  @Column({ default: 0 })
  noteCount: number;

  @Column({ default: 0 })
  followCount: number;

  @OneToMany(() => Moment, (moment) => moment.topic)
  moments: Moment[];

  @OneToMany(() => Note, (note) => note.topic)
  notes: Note[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

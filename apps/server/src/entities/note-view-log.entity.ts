import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';

@Entity()
export class NoteViewLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  note: Note;

  @Column({ nullable: true })
  noteId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  ip: string;

  @Column()
  viewDate: string;

  @CreateDateColumn()
  createdAt: Date;
}

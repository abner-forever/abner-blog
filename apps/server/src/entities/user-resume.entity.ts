import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserResume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.resume, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  resumeName: string | null;

  @Column({ nullable: true })
  resumeTitle: string | null;

  @Column({ type: 'text', nullable: true })
  resumeSkills: string | null;

  @Column({ type: 'text', nullable: true })
  resumeTimeline: string | null;

  @Column({ nullable: true })
  resumeLocation: string | null;

  @Column({ nullable: true })
  resumeCompany: string | null;

  @Column({ nullable: true })
  resumeGithub: string | null;

  @Column({ nullable: true })
  resumeJuejin: string | null;

  @Column({ nullable: true })
  resumeBlog: string | null;

  @Column({ type: 'text', nullable: true })
  resumeHobbies: string | null;

  @Column({ default: true })
  isResumePublic: boolean;
}

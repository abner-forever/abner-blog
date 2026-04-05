import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';

@Entity()
@Unique(['note', 'user'])
export class NoteFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Note, (note) => note.favorites, { onDelete: 'CASCADE' })
  note: Note;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  /** 由「收藏到收藏夹」自动创建；取消全部收藏夹项时可安全删除，不影响仅通过 /favorite 接口收藏的记录 */
  @Column({ default: false })
  syncedFromCollection: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

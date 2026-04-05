import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';

@Entity()
export class NoteCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => NoteCollectionItem, (item) => item.collection)
  items: NoteCollectionItem[];

  @Column({ default: 0 })
  noteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
@Unique(['collection', 'note'])
export class NoteCollectionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NoteCollection, (collection) => collection.items, {
    onDelete: 'CASCADE',
  })
  collection: NoteCollection;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  note: Note;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('custom_components')
@Index('idx_component_name', ['name'], { unique: true })
export class CustomComponent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ type: 'longtext' })
  html: string;

  @Column({ type: 'longtext', nullable: true })
  css?: string;

  @Column({ type: 'longtext', nullable: true })
  script?: string;

  @Column({ length: 50, default: 'user' })
  type: 'system' | 'user';

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

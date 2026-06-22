import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('page_versions')
@Index('idx_version_page_id', ['pageId'])
@Index('idx_version_page_version', ['pageId', 'versionNumber'], {
  unique: true,
})
export class PageVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pageId: number;

  @Column()
  versionNumber: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title?: string;

  @Column({ type: 'longtext', nullable: true })
  schema: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status?: string;

  @CreateDateColumn()
  createdAt: Date;
}

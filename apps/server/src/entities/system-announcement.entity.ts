import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SystemAnnouncement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  bodyRich: string;

  @Column('simple-json', { nullable: true })
  imageUrls: string[] | null;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date | null;

  /** 管理端撤回后 C 端仅展示「已撤回」，不再展示正文 */
  @Column({ type: 'datetime', nullable: true })
  recalledAt: Date | null;

  /**
   * 推送到用户通知中心的版本号，首次发布为 1，每次「重新推送」递增。
   * 用于 C 端提示内容有更新。
   */
  @Column({ type: 'int', default: 0 })
  notifyRevision: number;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

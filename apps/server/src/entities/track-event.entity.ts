import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'other';
export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';

@Entity('track_events')
@Index(['eventName', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['sessionId'])
export class TrackEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128 })
  eventName: string;

  @Column({ type: 'json', nullable: true })
  eventData: Record<string, unknown>;

  @Column({ nullable: true })
  userId: number;

  @Column({ length: 64, nullable: true })
  anonymousId: string;

  @Column({ length: 64, nullable: true })
  sessionId: string;

  @Column({ length: 2048, nullable: true })
  pageUrl: string;

  @Column({ length: 512, nullable: true })
  pageTitle: string;

  @Column({ length: 2048, nullable: true })
  referrer: string;

  @Column({ length: 64, nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({
    type: 'enum',
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop',
    nullable: true,
  })
  deviceType: DeviceType;

  @Column({
    type: 'enum',
    enum: ['chrome', 'firefox', 'safari', 'edge', 'ie', 'other'],
    default: 'other',
    nullable: true,
  })
  browser: Browser;

  @Column({
    type: 'enum',
    enum: ['windows', 'macos', 'linux', 'android', 'ios', 'other'],
    default: 'other',
    nullable: true,
  })
  os: OS;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MCPServerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

export enum MCPServerType {
  BUILTIN = 'builtin',
  MARKETPLACE = 'marketplace',
  CUSTOM = 'custom',
}

@Entity('mcp_server')
export class MCPServer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: MCPServerType,
    default: MCPServerType.BUILTIN,
  })
  type: MCPServerType;

  @Column({ nullable: true })
  marketplaceId: string;

  @Column({ type: 'json', nullable: true })
  config: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MCPServerStatus,
    default: MCPServerStatus.ACTIVE,
  })
  status: MCPServerStatus;

  @Column({ nullable: true })
  lastError: string;

  @Column({ type: 'json', nullable: true })
  allowedTools: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  indexedAt: Date;
}

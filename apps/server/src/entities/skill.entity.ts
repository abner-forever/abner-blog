import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SkillType {
  BUILTIN = 'builtin',
  MARKETPLACE = 'marketplace',
}

export enum SkillStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Skill workflow node types
export interface SkillNode {
  id: string;
  type: 'prompt' | 'tool' | 'condition' | 'end';
  // For prompt nodes
  prompt?: string;
  // For tool nodes
  tool?: {
    name: string;
    params?: Record<string, string>;
  };
  // For condition nodes
  condition?: {
    expression: string;
    trueNodeId: string;
    falseNodeId: string;
  };
  // For end nodes
  end?: {
    message?: string;
  };
}

// Skill workflow edge
export interface SkillEdge {
  from: string;
  to: string;
  condition?: string;
}

// Skill workflow definition
export interface SkillWorkflow {
  nodes: SkillNode[];
  edges: SkillEdge[];
  startNodeId: string;
}

@Entity('skill')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: SkillType,
    default: SkillType.MARKETPLACE,
  })
  type: SkillType;

  @Column({ type: 'json' })
  workflow: SkillWorkflow;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true })
  tools: string[];

  @Column({ nullable: true })
  marketplaceId: string;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ nullable: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: SkillStatus,
    default: SkillStatus.INACTIVE,
  })
  status: SkillStatus;

  @CreateDateColumn()
  createdAt: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { SkillWorkflow } from '../../entities/skill.entity';

export class CreateSkillDto {
  @ApiProperty({ description: '技能名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '图标' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: '工作流定义' })
  @IsOptional()
  workflow?: SkillWorkflow;

  @ApiPropertyOptional({ description: '需要的工具列表' })
  @IsArray()
  @IsOptional()
  tools?: string[];

  @ApiPropertyOptional({ description: 'AI角色头像' })
  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({ description: '技能名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '图标' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: '工作流定义' })
  @IsOptional()
  workflow?: SkillWorkflow;

  @ApiPropertyOptional({ description: '需要的工具列表' })
  @IsArray()
  @IsOptional()
  tools?: string[];

  @ApiPropertyOptional({ description: 'AI角色头像' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}

export class SkillResponseDto {
  @ApiProperty({ description: '技能ID' })
  id: string;

  @ApiProperty({ description: '技能名称' })
  name: string;

  @ApiProperty({ description: '技能描述' })
  description: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '类型' })
  type: string;

  @ApiProperty({ description: '工作流定义' })
  workflow: SkillWorkflow;

  @ApiProperty({ description: 'AI角色头像' })
  avatar: string;

  @ApiProperty({ description: '需要的工具列表' })
  tools: string[];

  @ApiProperty({ description: '是否全局技能' })
  isGlobal: boolean;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class MarketplaceSkillDto {
  @ApiProperty({ description: 'Marketplace ID' })
  id: string;

  @ApiProperty({ description: '技能名称' })
  name: string;

  @ApiProperty({ description: '技能描述' })
  description: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '需要的工具列表' })
  tools: string[];

  @ApiProperty({ description: '是否已安装' })
  isInstalled: boolean;

  @ApiProperty({ description: '是否全局技能' })
  isGlobal: boolean;
}

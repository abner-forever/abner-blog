import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class InstallMCPServerDto {
  @ApiProperty({ description: 'MCP服务器ID (marketplaceId)' })
  @IsString()
  marketplaceId: string;

  @ApiPropertyOptional({ description: '服务器名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '配置信息' })
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '允许使用的工具列表' })
  @IsArray()
  @IsOptional()
  allowedTools?: string[];
}

export class UpdateMCPServerDto {
  @ApiPropertyOptional({ description: '服务器名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '配置信息' })
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['active', 'inactive', 'error'],
  })
  @IsEnum(['active', 'inactive', 'error'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'error';

  @ApiPropertyOptional({ description: '允许使用的工具列表' })
  @IsArray()
  @IsOptional()
  allowedTools?: string[];
}

export class MCPServerResponseDto {
  @ApiProperty({ description: '服务器ID' })
  id: string;

  @ApiProperty({ description: '服务器名称' })
  name: string;

  @ApiProperty({ description: '描述' })
  description: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '类型' })
  type: string;

  @ApiProperty({ description: 'marketplace ID' })
  marketplaceId: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiPropertyOptional({ description: '最后错误' })
  lastError?: string;

  @ApiProperty({ description: '可用工具列表' })
  allowedTools: string[];

  @ApiPropertyOptional({ description: '配置信息' })
  config?: Record<string, unknown>;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiPropertyOptional({
    description: '远端是否仍缺少可连通的 URL（目录项或已安装实例）',
  })
  requiresConfig?: boolean;
}

export class MarketplaceMCPServerDto {
  @ApiProperty({ description: 'Marketplace ID' })
  id: string;

  @ApiProperty({ description: '服务器名称' })
  name: string;

  @ApiProperty({ description: '描述' })
  description: string;

  @ApiProperty({ description: '图标' })
  icon: string;

  @ApiProperty({ description: '可用工具列表' })
  tools: string[];

  @ApiProperty({
    description: '来源（builtin=系统内置，marketplace=市场下载）',
    enum: ['builtin', 'marketplace'],
  })
  source: 'builtin' | 'marketplace';

  @ApiProperty({ description: '是否已安装' })
  isInstalled: boolean;

  @ApiPropertyOptional({
    description: '安装后是否仍需配置远端 URL 等才可调用',
  })
  requiresConfig?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: '知识库名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '知识库描述' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional({ description: '知识库名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '知识库描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}

export class SearchKnowledgeBaseDto {
  @ApiProperty({ description: '搜索查询文本' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: '知识库ID列表，为空则搜索所有' })
  @IsString({ each: true })
  @IsOptional()
  knowledgeBaseIds?: string[];

  @ApiPropertyOptional({ description: '返回结果数量', default: 5 })
  @IsOptional()
  topK?: number;
}

export class KnowledgeBaseResponseDto {
  @ApiProperty({ description: '知识库ID' })
  id: string;

  @ApiProperty({ description: '知识库名称' })
  name: string;

  @ApiProperty({ description: '知识库描述' })
  description: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: 'chunk数量' })
  chunkCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '索引时间' })
  indexedAt?: Date;
}

export class KnowledgeChunkResponseDto {
  @ApiProperty({ description: 'chunk ID' })
  id: string;

  @ApiProperty({ description: '内容' })
  content: string;

  @ApiProperty({ description: 'chunk索引' })
  chunkIndex: number;

  @ApiProperty({ description: '元数据' })
  metadata: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class SearchResultDto {
  @ApiProperty({ description: 'chunk ID' })
  id: string;

  @ApiProperty({ description: '内容' })
  content: string;

  @ApiProperty({ description: '元数据' })
  metadata: string;

  @ApiProperty({ description: '相似度分数' })
  score: number;

  @ApiProperty({ description: '所属知识库' })
  knowledgeBaseId: string;

  @ApiProperty({ description: '所属知识库名称' })
  knowledgeBaseName: string;
}

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

export class KnowledgeDocumentProcessingStatusDto {
  @ApiProperty({
    description: '是否正在处理文档',
    example: true,
  })
  processing: boolean;

  @ApiProperty({
    description: '当前处理阶段',
    example: 'embedding',
  })
  stage: string;

  @ApiProperty({
    description: '进度百分比(0-100)',
    example: 58,
  })
  progress: number;

  @ApiProperty({
    description: '阶段提示文案',
    example: '正在生成向量 384/1294',
  })
  message: string;

  @ApiPropertyOptional({
    description: '总文本块数量',
    example: 1294,
  })
  totalChunks?: number;

  @ApiPropertyOptional({
    description: '已完成文本块数量',
    example: 384,
  })
  completedChunks?: number;

  @ApiPropertyOptional({
    description: '预计剩余秒数',
    example: 87,
  })
  etaSeconds?: number;

  @ApiPropertyOptional({
    description: '后台任务ID',
    example: 'e5a9e99d-bf3d-4662-b0f4-0f1bb1a103e4',
  })
  taskId?: string;
}

export class KnowledgeDocumentUploadAcceptedDto {
  @ApiProperty({
    description: '后台任务ID',
    example: 'e5a9e99d-bf3d-4662-b0f4-0f1bb1a103e4',
  })
  taskId: string;

  @ApiProperty({
    description: '是否已进入后台处理',
    example: true,
  })
  accepted: boolean;
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

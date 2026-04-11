import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  SearchKnowledgeBaseDto,
  KnowledgeBaseResponseDto,
  KnowledgeChunkResponseDto,
  SearchResultDto,
} from './dto/knowledge-base.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('knowledge-base')
@ApiBearerAuth('JWT')
@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @ApiOperation({ summary: '创建知识库' })
  @ApiResponse({ status: 201, type: KnowledgeBaseResponseDto })
  @Post()
  create(
    @Body() dto: CreateKnowledgeBaseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.knowledgeBaseService.create(dto, req.user.userId);
  }

  @ApiOperation({ summary: '获取用户所有知识库' })
  @ApiResponse({ status: 200, type: [KnowledgeBaseResponseDto] })
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.knowledgeBaseService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: '获取知识库详情' })
  @ApiResponse({ status: 200, type: KnowledgeBaseResponseDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.knowledgeBaseService.findOne(id, req.user.userId);
  }

  @ApiOperation({ summary: '更新知识库' })
  @ApiResponse({ status: 200, type: KnowledgeBaseResponseDto })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.knowledgeBaseService.update(id, dto, req.user.userId);
  }

  @ApiOperation({ summary: '删除知识库' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.knowledgeBaseService.remove(id, req.user.userId);
  }

  @ApiOperation({ summary: '上传文档到知识库' })
  @ApiResponse({ status: 201, type: [KnowledgeChunkResponseDto] })
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      return { message: '请上传文件' };
    }
    return this.knowledgeBaseService.addDocument(id, file, req.user.userId);
  }

  @ApiOperation({ summary: '获取知识库的chunks' })
  @ApiResponse({ status: 200, type: [KnowledgeChunkResponseDto] })
  @Get(':id/chunks')
  getChunks(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.knowledgeBaseService.getChunks(id, req.user.userId);
  }

  @ApiOperation({ summary: '删除chunk' })
  @ApiResponse({ status: 200 })
  @Delete('chunks/:chunkId')
  deleteChunk(
    @Param('chunkId') chunkId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.knowledgeBaseService.deleteChunk(chunkId, req.user.userId);
  }

  @ApiOperation({ summary: '搜索知识库' })
  @ApiResponse({ status: 200, type: [SearchResultDto] })
  @Post('search')
  search(
    @Body() dto: SearchKnowledgeBaseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.knowledgeBaseService.search(dto, req.user.userId);
  }
}

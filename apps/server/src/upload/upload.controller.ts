import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadImageResponseDto } from '../common/dto/responses/user.response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { imageMulterOptionsByBusinessPath } from '../config/multer.config';
import { normalizeBusinessPath } from './utils/business-path';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ChunkUploadService } from './chunk-upload.service';
import { InitChunkUploadDto } from './dto/init-chunk-upload.dto';
import { UploadChunkBodyDto } from './dto/upload-chunk.dto';
import { MergeUploadDto } from './dto/merge-upload.dto';

const chunkMulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
};

@ApiTags('upload')
@ApiBearerAuth('JWT')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly chunkUploadService: ChunkUploadService) {}

  private buildImageResult(
    file: Express.Multer.File,
    req: Request,
    businessPath: string,
    markdown?: boolean,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.CDN_URL || `${protocol}://${host}`;
    const relativePath = `image/${businessPath}/${file.filename}`;
    const publicPath = `/assets/${relativePath}`;
    const fullUrl = `${baseUrl}${publicPath}`;

    if (markdown) {
      return {
        success: 1,
        url: fullUrl,
        message: '上传成功',
      };
    }

    return {
      url: fullUrl,
      path: publicPath,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @ApiOperation({
    summary: '上传图片（query.businessPath 指定业务目录，默认 common）',
  })
  @ApiQuery({
    name: 'businessPath',
    required: false,
    description: '业务路径，如 common、notes、moments、blogs、avatars',
  })
  @ApiQuery({
    name: 'markdown',
    required: false,
    description:
      '传 1 或 true 时返回 Markdown 编辑器格式（success/url/message）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: UploadImageResponseDto })
  @Post('image')
  @UseInterceptors(FileInterceptor('file', imageMulterOptionsByBusinessPath))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Query('markdown') markdown?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    const businessPath = normalizeBusinessPath(
      req.query?.businessPath as string | undefined,
    );
    return this.buildImageResult(
      file,
      req,
      businessPath,
      markdown === '1' || markdown === 'true',
    );
  }

  @ApiOperation({ summary: '初始化分片上传（视频 / 通用文件）' })
  @Post('chunk/init')
  async initChunkUpload(
    @Body() dto: InitChunkUploadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.CDN_URL || `${protocol}://${host}`;
    return this.chunkUploadService.initUpload(
      dto.kind,
      dto.businessPath,
      dto.filename,
      dto.fileSize,
      dto.fileHash ?? '',
      dto.totalChunks ?? 0,
      dto.mimeType ?? '',
      userId,
      baseUrl,
    );
  }

  @ApiOperation({ summary: '上传分片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        uploadId: { type: 'string' },
        chunkIndex: { type: 'number' },
        totalChunks: { type: 'number' },
      },
    },
  })
  @Post('chunk')
  @UseInterceptors(FileInterceptor('file', chunkMulterOptions))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadChunkBodyDto,
  ) {
    if (!file) {
      throw new BadRequestException('请上传分片文件');
    }
    return this.chunkUploadService.uploadChunk(
      dto.uploadId,
      dto.chunkIndex,
      dto.totalChunks,
      file.buffer,
    );
  }

  @ApiOperation({ summary: '合并分片' })
  @Post('chunk/merge')
  async mergeChunks(
    @Body() dto: MergeUploadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.CDN_URL || `${protocol}://${host}`;
    return this.chunkUploadService.mergeChunks(dto.uploadId, userId, baseUrl);
  }

  @ApiOperation({ summary: '查询分片上传状态' })
  @Get('chunk/status/:uploadId')
  async getChunkStatus(@Param('uploadId') uploadId: string) {
    return this.chunkUploadService.getUploadStatus(uploadId);
  }

  @ApiOperation({ summary: '取消分片上传' })
  @Post('chunk/cancel/:uploadId')
  async cancelChunkUpload(@Param('uploadId') uploadId: string) {
    return this.chunkUploadService.cancelUpload(uploadId);
  }
}

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';
import type { ChunkUploadKind } from './dto/init-chunk-upload.dto';
import { normalizeBusinessPath } from './utils/business-path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const CHUNKS_DIR = path.join(UPLOAD_DIR, 'chunks');
const ASSETS_DIR = path.join(UPLOAD_DIR, 'assets');
const UPLOAD_EXPIRY = 24 * 60 * 60;

interface UploadState {
  uploadId: string;
  kind: ChunkUploadKind;
  businessPath: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileHash: string;
  totalChunks: number;
  uploadedChunks: number[];
  status: 'uploading' | 'merging' | 'completed' | 'failed';
  userId: number;
  mimeType: string;
  createdAt: number;
}

interface HashMapping {
  filename: string;
  url: string;
}

@Injectable()
export class ChunkUploadService {
  private readonly logger = new Logger(ChunkUploadService.name);
  private readonly maxVideoSize: number;
  private readonly maxFileSize: number;

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {
    this.maxVideoSize =
      this.configService.get<number>('VIDEO_MAX_SIZE') ||
      2 * 1024 * 1024 * 1024;
    this.maxFileSize =
      this.configService.get<number>('FILE_MAX_SIZE') || 500 * 1024 * 1024;
    this.ensureDirsExist();
  }

  private ensureDirsExist() {
    for (const dir of [UPLOAD_DIR, CHUNKS_DIR, ASSETS_DIR]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private typeDirName(kind: ChunkUploadKind): 'video' | 'file' {
    return kind === 'video' ? 'video' : 'file';
  }

  private targetDir(kind: ChunkUploadKind, businessPath: string): string {
    return path.join(ASSETS_DIR, this.typeDirName(kind), businessPath);
  }

  private publicAssetPath(
    kind: ChunkUploadKind,
    businessPath: string,
    filename: string,
  ): string {
    return `/assets/${this.typeDirName(kind)}/${businessPath}/${filename}`;
  }

  private maxSizeFor(kind: ChunkUploadKind): number {
    return kind === 'video' ? this.maxVideoSize : this.maxFileSize;
  }

  private getUploadKey(uploadId: string): string {
    return `upload:chunk:${uploadId}`;
  }

  private getHashKey(
    kind: ChunkUploadKind,
    businessPath: string,
    fileHash: string,
  ): string {
    return `upload:hash:${kind}:${businessPath}:${fileHash}`;
  }

  private getStateFilePath(uploadId: string): string {
    return path.join(CHUNKS_DIR, uploadId, 'state.json');
  }

  private async saveState(uploadId: string, state: UploadState): Promise<void> {
    const key = this.getUploadKey(uploadId);
    const stateJson = JSON.stringify(state);
    const stateFile = this.getStateFilePath(uploadId);
    const chunkDir = path.dirname(stateFile);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    try {
      await this.redisService.set(key, stateJson, UPLOAD_EXPIRY);
      fs.writeFileSync(stateFile, stateJson, 'utf-8');
      return;
    } catch (error) {
      this.logger.warn(`Redis 保存状态失败，使用文件系统降级: ${error}`);
    }
    fs.writeFileSync(stateFile, stateJson, 'utf-8');
  }

  private async loadState(uploadId: string): Promise<UploadState | null> {
    const stateFile = this.getStateFilePath(uploadId);
    if (fs.existsSync(stateFile)) {
      try {
        const data = fs.readFileSync(stateFile, 'utf-8');
        return JSON.parse(data) as UploadState;
      } catch (error) {
        this.logger.warn(`文件系统读取状态失败: ${error}`);
      }
    }
    const key = this.getUploadKey(uploadId);
    try {
      const data = await this.redisService.get(key);
      if (data) {
        try {
          fs.writeFileSync(stateFile, data, 'utf-8');
        } catch {
          // ignore
        }
        return JSON.parse(data) as UploadState;
      }
    } catch (error) {
      this.logger.warn(`Redis 加载状态失败: ${error}`);
    }
    return null;
  }

  private async deleteState(uploadId: string): Promise<void> {
    try {
      await this.redisService.del(this.getUploadKey(uploadId));
    } catch (error) {
      this.logger.warn(`Redis 删除状态失败: ${error}`);
    }
    const stateFile = this.getStateFilePath(uploadId);
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  }

  async initUpload(
    kind: ChunkUploadKind,
    businessPathRaw: string | undefined,
    filename: string,
    fileSize: number,
    fileHash: string,
    totalChunks: number,
    mimeType: string,
    userId: number,
    baseUrl?: string,
  ): Promise<{ uploadId: string; skipUpload: boolean; url?: string }> {
    const businessPath = normalizeBusinessPath(businessPathRaw);
    const maxSize = this.maxSizeFor(kind);
    if (fileSize > maxSize) {
      throw new BadRequestException(
        `文件大小超过限制，最大支持 ${maxSize / 1024 / 1024}MB`,
      );
    }

    if (kind === 'video' && mimeType && !mimeType.startsWith('video/')) {
      throw new BadRequestException('视频分片上传要求 MIME 为 video/*');
    }

    if (fileHash) {
      const existingUrl = await this.checkFileExists(
        kind,
        businessPath,
        fileHash,
      );
      if (existingUrl) {
        this.logger.log(
          `秒传成功，文件已存在: ${kind}/${businessPath}/${fileHash}`,
        );
        const fullUrl = baseUrl ? `${baseUrl}${existingUrl}` : existingUrl;
        return { uploadId: '', skipUpload: true, url: fullUrl };
      }
    }

    const chunkSize = 2 * 1024 * 1024;
    const calculatedTotalChunks =
      totalChunks || Math.ceil(fileSize / chunkSize);

    const uploadId = uuidv4();
    const state: UploadState = {
      uploadId,
      kind,
      businessPath,
      filename: `${filename.replace(/\.[^/.]+$/, '')}_${uploadId}${path.extname(filename)}`,
      originalName: filename,
      fileSize,
      fileHash,
      totalChunks: calculatedTotalChunks,
      uploadedChunks: [],
      status: 'uploading',
      userId,
      mimeType,
      createdAt: Date.now(),
    };

    const chunkDir = path.join(CHUNKS_DIR, uploadId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    await this.saveState(uploadId, state);
    this.logger.log(
      `初始化分片上传: kind=${kind}, business=${businessPath}, uploadId=${uploadId}, totalChunks=${calculatedTotalChunks}`,
    );

    return { uploadId, skipUpload: false };
  }

  private async checkFileExists(
    kind: ChunkUploadKind,
    businessPath: string,
    fileHash: string,
  ): Promise<string | null> {
    const destDir = this.targetDir(kind, businessPath);
    const hashDir = path.join(destDir, '.hash');
    const hashFile = path.join(hashDir, `${fileHash}.json`);

    if (fs.existsSync(hashFile)) {
      const data = fs.readFileSync(hashFile, 'utf-8');
      const parsed = JSON.parse(data) as HashMapping;
      const filePath = path.join(destDir, parsed.filename);
      if (fs.existsSync(filePath)) {
        return parsed.url;
      }
    }

    const key = this.getHashKey(kind, businessPath, fileHash);
    try {
      const data = await this.redisService.get(key);
      if (data) {
        const parsed = JSON.parse(data) as HashMapping;
        const filePath = path.join(destDir, parsed.filename);
        if (fs.existsSync(filePath)) {
          return parsed.url;
        }
      }
    } catch (error) {
      this.logger.warn(`Redis 秒传检查失败: ${error}`);
    }

    return null;
  }

  private async saveHashMapping(
    kind: ChunkUploadKind,
    businessPath: string,
    fileHash: string,
    filename: string,
    url: string,
  ): Promise<void> {
    const destDir = this.targetDir(kind, businessPath);
    const hashDir = path.join(destDir, '.hash');
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true });
    }
    const hashFile = path.join(hashDir, `${fileHash}.json`);
    fs.writeFileSync(hashFile, JSON.stringify({ filename, url }), 'utf-8');

    try {
      await this.redisService.set(
        this.getHashKey(kind, businessPath, fileHash),
        JSON.stringify({ filename, url }),
      );
    } catch (error) {
      this.logger.warn(`Redis 保存 hash 映射失败: ${error}`);
    }
  }

  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    chunkBuffer: Buffer,
  ): Promise<{ uploadedChunks: number[]; progress: number }> {
    const state = await this.loadState(uploadId);

    if (!state) {
      throw new NotFoundException('上传任务不存在或已过期');
    }

    if (state.status !== 'uploading') {
      throw new BadRequestException('上传任务状态无效');
    }

    const chunkPath = path.join(CHUNKS_DIR, uploadId, `chunk_${chunkIndex}`);
    const chunkDir = path.dirname(chunkPath);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    fs.writeFileSync(chunkPath, chunkBuffer);

    if (!state.uploadedChunks.includes(chunkIndex)) {
      state.uploadedChunks.push(chunkIndex);
      state.uploadedChunks.sort((a, b) => a - b);
    }

    await this.saveState(uploadId, state);

    const progress = Math.round(
      (state.uploadedChunks.length / state.totalChunks) * 100,
    );

    this.logger.log(
      `分片上传: uploadId=${uploadId}, chunk=${chunkIndex}/${totalChunks}, progress=${progress}%`,
    );

    return {
      uploadedChunks: state.uploadedChunks,
      progress,
    };
  }

  async getUploadStatus(uploadId: string): Promise<{
    uploadedChunks: number[];
    totalChunks: number;
    progress: number;
  }> {
    const state = await this.loadState(uploadId);

    if (!state) {
      throw new NotFoundException('上传任务不存在或已过期');
    }

    return {
      uploadedChunks: state.uploadedChunks,
      totalChunks: state.totalChunks,
      progress: Math.round(
        (state.uploadedChunks.length / state.totalChunks) * 100,
      ),
    };
  }

  async mergeChunks(
    uploadId: string,
    userId: number,
    baseUrl?: string,
  ): Promise<{ url: string }> {
    const state = await this.loadState(uploadId);

    if (!state) {
      throw new NotFoundException('上传任务不存在或已过期');
    }

    if (state.status === 'completed') {
      throw new BadRequestException('文件已上传完成');
    }

    if (!state.businessPath) {
      throw new BadRequestException('上传任务缺少 businessPath');
    }

    if (state.uploadedChunks.length !== state.totalChunks) {
      const missing: number[] = [];
      for (let i = 0; i < state.totalChunks; i++) {
        if (!state.uploadedChunks.includes(i)) {
          missing.push(i);
        }
      }
      throw new BadRequestException(
        `还有 ${missing.length} 个分片未上传: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`,
      );
    }

    state.status = 'merging';
    await this.saveState(uploadId, state);

    const finalDir = this.targetDir(state.kind, state.businessPath);

    try {
      this.ensureDirsExist();
      const finalPath = path.join(finalDir, state.filename);
      const parentDir = path.dirname(finalPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < state.totalChunks; i++) {
        const chunkPath = path.join(CHUNKS_DIR, uploadId, `chunk_${i}`);
        const chunkBuffer = fs.readFileSync(chunkPath);
        writeStream.write(chunkBuffer);
      }

      writeStream.end();

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const chunkDir = path.join(CHUNKS_DIR, uploadId);
      fs.rmSync(chunkDir, { recursive: true, force: true });

      state.status = 'completed';
      await this.saveState(uploadId, state);

      const publicPath = this.publicAssetPath(
        state.kind,
        state.businessPath,
        state.filename,
      );

      if (state.fileHash) {
        await this.saveHashMapping(
          state.kind,
          state.businessPath,
          state.fileHash,
          state.filename,
          publicPath,
        );
      }

      if (state.kind === 'video') {
        const video = this.videoRepository.create({
          filename: state.filename,
          originalName: state.originalName,
          url: publicPath,
          size: state.fileSize,
          userId,
        });
        await this.videoRepository.save(video);
      }

      this.logger.log(
        `分片合并完成: kind=${state.kind}, business=${state.businessPath}, uploadId=${uploadId}, filename=${state.filename}`,
      );

      return { url: baseUrl ? `${baseUrl}${publicPath}` : publicPath };
    } catch (error) {
      state.status = 'failed';
      await this.saveState(uploadId, state);
      throw error;
    }
  }

  async cancelUpload(uploadId: string): Promise<void> {
    const state = await this.loadState(uploadId);

    if (state) {
      const chunkDir = path.join(CHUNKS_DIR, uploadId);
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }

      await this.deleteState(uploadId);
      this.logger.log(`取消上传: uploadId=${uploadId}`);
    }
  }
}

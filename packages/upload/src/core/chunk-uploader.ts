import { Uploader } from './uploader';
import type {
  UploadTask,
  UploadOptions,
  InitUploadResponse,
  UploadChunkResponse,
  UploadStatusResponse,
} from '../types';
import { UploadStatus, FileType } from '../types';
import {
  calculateFileHash,
  sliceFile,
  getFileType,
} from '../utils/file';
import {
  saveUploadState,
  getUploadState,
  removeUploadState,
} from '../utils/storage';
import {
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CONCURRENCY,
  DEFAULT_RETRIES,
  RETRY_DELAY,
} from '../constants';

/**
 * 分片上传配置
 */
export interface ChunkUploadOptions extends UploadOptions {
  /** 分片落盘业务路径，默认 common */
  chunkBusinessPath?: string;
}

interface PendingUpload {
  task: UploadTask;
  fileHash: string;
  totalChunks: number;
  uploadedChunks: Set<number>;
  isPaused: boolean;
  isCancelled: boolean;
  abortController: AbortController;
}

export class ChunkUploader extends Uploader {
  private baseUrl: string;
  private pendingUploads: Map<string, PendingUpload> = new Map();
  private readonly resumeKeyPrefix = 'upload:video-resume:';

  constructor(options: ChunkUploadOptions) {
    super(options);
    this.baseUrl = options.baseUrl || '';
  }

  /** Nest TransformInterceptor 包装为 { success, data } */
  private async parseApiResponse<T>(response: Response): Promise<T> {
    const json: unknown = await response.json();
    if (
      json &&
      typeof json === 'object' &&
      'success' in json &&
      (json as { success: unknown }).success === true &&
      'data' in json
    ) {
      return (json as { data: T }).data;
    }
    return json as T;
  }

  private getResumeStorageKey(fileHash: string, fileSize: number): string {
    return `${this.resumeKeyPrefix}${fileHash}:${fileSize}`;
  }

  /**
   * 上传文件（分片上传）
   */
  async upload(file: File): Promise<UploadTask> {
    this.validateFile(file);

    // 自动检测文件类型
    const fileType = getFileType(file);
    const task = this.createTask(file);
    task.type = fileType;

    // 计算文件 hash
    const fileHash = await calculateFileHash(file);

    // 计算分片数
    const chunkSize = this.options.chunkSize || DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    task.totalChunks = totalChunks;
    task.status = UploadStatus.UPLOADING;
    task.id = '';

    const resumeStorageKey = this.getResumeStorageKey(fileHash, file.size);
    const uploadedChunks = new Set<number>();
    let uploadId = '';

    const rawResume = localStorage.getItem(resumeStorageKey);
    if (rawResume) {
      try {
        const parsed = JSON.parse(rawResume) as { uploadId?: string };
        if (parsed.uploadId) {
          const status = await this.queryStatus(parsed.uploadId);
          if (status.totalChunks === totalChunks) {
            uploadId = parsed.uploadId;
            status.chunks?.forEach((i) => uploadedChunks.add(i));
          } else {
            localStorage.removeItem(resumeStorageKey);
          }
        }
      } catch {
        localStorage.removeItem(resumeStorageKey);
      }
    }

    if (!uploadId) {
      const initResponse = await this.initUpload(
        file.name,
        file.size,
        fileHash,
        totalChunks,
        file.type,
      );

      // 秒传成功
      if (initResponse.skipUpload && initResponse.url) {
        task.status = UploadStatus.COMPLETED;
        task.url = initResponse.url;
        task.progress = 100;
        localStorage.removeItem(resumeStorageKey);
        this.options.onProgress?.(task);
        this.options.onComplete?.(task);
        return task;
      }

      uploadId = initResponse.uploadId;
    }

    task.id = uploadId;
    localStorage.setItem(resumeStorageKey, JSON.stringify({ uploadId }));

    // 保存状态到 localStorage
    saveUploadState({
      taskId: uploadId,
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadedChunks: Array.from(uploadedChunks),
      status: UploadStatus.UPLOADING,
      type: fileType,
    });

    // 开始分片上传
    const pending: PendingUpload = {
      task,
      fileHash,
      totalChunks,
      uploadedChunks,
      isPaused: false,
      isCancelled: false,
      abortController: new AbortController(),
    };

    this.pendingUploads.set(uploadId, pending);

    if (pending.uploadedChunks.size === 0) {
      // 获取已上传的分片（断点续传）
      const status = await this.queryStatus(uploadId);
      status.chunks?.forEach((i) => pending.uploadedChunks.add(i));
    }

    // 开始上传
    await this.uploadChunks(uploadId, file, chunkSize, pending);
    localStorage.removeItem(resumeStorageKey);

    return task;
  }

  /**
   * 初始化上传
   */
  private async initUpload(
    filename: string,
    fileSize: number,
    fileHash: string,
    totalChunks: number,
    mimeType: string,
  ): Promise<InitUploadResponse> {
    const kind =
      this.options.chunkKind ??
      (this.options.type === FileType.VIDEO ? 'video' : 'file');
    const businessPath =
      (this.options as ChunkUploadOptions).chunkBusinessPath ?? 'common';
    const response = await fetch(`${this.baseUrl}/api/upload/chunk/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        kind,
        businessPath,
        filename,
        fileSize,
        fileHash,
        totalChunks,
        mimeType,
      }),
    });

    if (!response.ok) {
      throw new Error(`初始化上传失败: ${response.statusText}`);
    }

    return this.parseApiResponse<InitUploadResponse>(response);
  }

  /**
   * 上传分片
   */
  private async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob,
    totalChunks: number,
  ): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(chunkIndex));
    formData.append('totalChunks', String(totalChunks));

    const response = await fetch(`${this.baseUrl}/api/upload/chunk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`分片上传失败: ${response.statusText}`);
    }

    return this.parseApiResponse<UploadChunkResponse>(response);
  }

  /**
   * 上传所有分片（支持并发和断点续传）
   */
  private async uploadChunks(
    uploadId: string,
    file: File,
    chunkSize: number,
    pending: PendingUpload,
  ): Promise<void> {
    const chunks = sliceFile(file, chunkSize);
    const concurrency = this.options.concurrency || DEFAULT_CONCURRENCY;

    // 过滤出未上传的分片
    const pendingChunks: number[] = [];
    for (let i = 0; i < chunks.length; i++) {
      if (!pending.uploadedChunks.has(i)) {
        pendingChunks.push(i);
      }
    }

    // 更新进度
    const updateProgress = () => {
      pending.task.progress = Math.round(
        (pending.uploadedChunks.size / pending.totalChunks) * 100,
      );
      this.options.onProgress?.(pending.task);
    };

    // 上传单个分片（带重试）
    const uploadWithRetry = async (chunkIndex: number): Promise<void> => {
      const retries = this.options.retries || DEFAULT_RETRIES;

      for (let i = 0; i < retries; i++) {
        if (pending.isPaused || pending.isCancelled) {
          return;
        }

        try {
          await this.uploadChunk(
            uploadId,
            chunkIndex,
            chunks[chunkIndex],
            pending.totalChunks,
          );
          pending.uploadedChunks.add(chunkIndex);
          updateProgress();
          return;
        } catch (error) {
          if (i === retries - 1) {
            throw error;
          }
          await this.delay(RETRY_DELAY * (i + 1));
        }
      }
    };

    // 并发上传
    const runConcurrency = async () => {
      const queue = [...pendingChunks];
      const running: Promise<void>[] = [];

      while (queue.length > 0 || running.length > 0) {
        if (pending.isPaused || pending.isCancelled) {
          // 等待所有进行中的上传完成
          await Promise.all(running);
          return;
        }

        while (running.length < concurrency && queue.length > 0) {
          const chunkIndex = queue.shift()!;
          const promise = uploadWithRetry(chunkIndex).catch((error) => {
            if (!pending.isCancelled) {
              pending.task.status = UploadStatus.FAILED;
              pending.task.error = error.message;
              this.options.onError?.(pending.task, error);
            }
          });
          running.push(promise);
        }

        if (running.length > 0) {
          await Promise.race(running);
          // 移除已完成的
          for (let i = running.length - 1; i >= 0; i--) {
            const settled = await this.isPromiseSettled(running[i]);
            if (settled) {
              running.splice(i, 1);
            }
          }
        }
      }
    };

    await runConcurrency();

    // 全部上传完成，合并
    if (
      !pending.isPaused &&
      !pending.isCancelled &&
      pending.uploadedChunks.size === pending.totalChunks
    ) {
      try {
        const merged = await this.mergeChunks(uploadId);
        pending.task.status = UploadStatus.COMPLETED;
        pending.task.progress = 100;
        pending.task.url = merged.url;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('已上传完成')) {
          const initResult = await this.initUpload(
            pending.task.file.name,
            pending.task.file.size,
            pending.fileHash,
            pending.totalChunks,
            pending.task.file.type,
          );
          if (initResult.skipUpload && initResult.url) {
            pending.task.status = UploadStatus.COMPLETED;
            pending.task.progress = 100;
            pending.task.url = initResult.url;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      } finally {
        removeUploadState(uploadId);
        this.pendingUploads.delete(uploadId);
      }
      this.options.onProgress?.(pending.task);
      this.options.onComplete?.(pending.task);
    }
  }

  /**
   * 合并分片
   */
  private async mergeChunks(uploadId: string): Promise<{ url: string }> {
    const response = await fetch(`${this.baseUrl}/api/upload/chunk/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ uploadId }),
    });

    if (!response.ok) {
      const raw = (await response.text()).trim();
      throw new Error(raw || `合并分片失败: ${response.statusText}`);
    }

    return this.parseApiResponse<{ url: string }>(response);
  }

  /**
   * 查询上传状态
   */
  async queryStatus(uploadId: string): Promise<UploadTask> {
    const response = await fetch(
      `${this.baseUrl}/api/upload/chunk/status/${uploadId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`查询上传状态失败: ${response.statusText}`);
    }

    const data = await this.parseApiResponse<UploadStatusResponse>(response);
    return {
      id: uploadId,
      file: new File([], ''),
      type: FileType.VIDEO,
      status: UploadStatus.UPLOADING,
      progress: data.progress,
      totalChunks: data.totalChunks,
      chunks: data.uploadedChunks,
    };
  }

  /**
   * 暂停上传
   */
  pause(taskId: string): void {
    const pending = this.pendingUploads.get(taskId);
    if (pending) {
      pending.isPaused = true;
      pending.task.status = UploadStatus.PAUSED;
      pending.abortController.abort();

      // 更新 localStorage 状态
      const state = getUploadState(taskId);
      if (state) {
        state.status = UploadStatus.PAUSED;
        state.uploadedChunks = Array.from(pending.uploadedChunks);
        saveUploadState(state);
      }
    }
  }

  /**
   * 恢复上传
   */
  async resume(taskId: string): Promise<UploadTask> {
    // 从 localStorage 获取状态
    const state = getUploadState(taskId);
    if (!state) {
      throw new Error('上传任务不存在');
    }

    // 查询服务端已上传的分片
    const status = await this.queryStatus(taskId);
    const uploadedChunks = status.chunks || [];

    // 创建新的 pending
    const pending: PendingUpload = {
      task: {
        id: taskId,
        file: new File([], state.fileName),
        type: state.type,
        status: UploadStatus.UPLOADING,
        progress: 0,
        totalChunks: state.totalChunks,
        chunks: uploadedChunks,
      },
      fileHash: state.fileHash,
      totalChunks: state.totalChunks,
      uploadedChunks: new Set(uploadedChunks),
      isPaused: false,
      isCancelled: false,
      abortController: new AbortController(),
    };

    this.pendingUploads.set(taskId, pending);

    // 更新状态
    state.status = UploadStatus.UPLOADING;
    saveUploadState(state);

    // 需要重新获取文件，这里抛出错误提示调用者需要保存文件引用
    throw new Error('请使用 upload() 方法重新上传文件以继续');

    // 注意：实际实现中，建议在保存状态时同时保存文件的引用或使用 IndexedDB
  }

  /**
   * 取消上传
   */
  async cancel(taskId: string): Promise<void> {
    const pending = this.pendingUploads.get(taskId);
    if (pending) {
      pending.isCancelled = true;
      pending.abortController.abort();
      this.pendingUploads.delete(taskId);
    }

    // 从 localStorage 移除状态
    removeUploadState(taskId);

    // 通知服务端取消
    try {
      await fetch(`${this.baseUrl}/api/upload/chunk/cancel/${taskId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      // 忽略错误
    }
  }

  /**
   * 批量上传
   */
  async uploadBatch(files: File[]): Promise<UploadTask[]> {
    const tasks: UploadTask[] = [];

    for (const file of files) {
      try {
        const task = await this.upload(file);
        tasks.push(task);
      } catch (error) {
        const task = this.createTask(file);
        task.status = UploadStatus.FAILED;
        task.error = error instanceof Error ? error.message : '未知错误';
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 检查 Promise 是否已 settled
   */
  private async isPromiseSettled(promise: Promise<void>): Promise<boolean> {
    try {
      await promise;
      return true;
    } catch {
      return true;
    }
  }
}

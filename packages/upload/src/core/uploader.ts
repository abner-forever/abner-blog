import type { UploadOptions, UploadTask } from '../types';
import { UploadStatus } from '../types';
import { DEFAULT_MAX_SIZE } from '../constants';

/**
 * 基础 Uploader 抽象类
 */
export abstract class Uploader {
  protected options: UploadOptions;

  constructor(options: UploadOptions) {
    this.options = {
      maxSize: DEFAULT_MAX_SIZE,
      chunkSize: 2 * 1024 * 1024,
      concurrency: 3,
      retries: 3,
      ...options,
    };
  }

  /**
   * 上传文件
   */
  abstract upload(file: File): Promise<UploadTask>;

  /**
   * 暂停上传
   */
  abstract pause(taskId: string): void;

  /**
   * 恢复上传
   */
  abstract resume(taskId: string): Promise<UploadTask>;

  /**
   * 取消上传
   */
  abstract cancel(taskId: string): void;

  /**
   * 查询上传状态
   */
  abstract queryStatus(taskId: string): Promise<UploadTask>;

  /**
   * 批量上传
   */
  abstract uploadBatch(files: File[]): Promise<UploadTask[]>;

  /**
   * 创建上传任务
   */
  protected createTask(file: File): UploadTask {
    return {
      id: '',
      file,
      type: this.options.type,
      status: UploadStatus.IDLE,
      progress: 0,
    };
  }

  /**
   * 验证文件
   */
  protected validateFile(file: File): void {
    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new Error(`文件大小超过限制，最大支持 ${this.options.maxSize / 1024 / 1024}MB`);
    }

    if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
      if (!this.options.allowedTypes.includes(file.type)) {
        throw new Error(`不支持的文件类型: ${file.type}`);
      }
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const customKey = this.options.authTokenStorageKey;
    let token: string | null = null;
    if (typeof localStorage !== 'undefined') {
      if (customKey) {
        token = localStorage.getItem(customKey);
      } else {
        for (const k of ['user-token', 'access_token'] as const) {
          token = localStorage.getItem(k);
          if (token) break;
        }
      }
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
}

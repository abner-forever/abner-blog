import { Uploader } from './uploader';
import type { UploadTask } from '../types';
import { UploadStatus, FileType } from '../types';
import { getFileType } from '../utils/file';

/**
 * 普通上传（单文件直传，适用于小文件如图片）
 */
export class SimpleUploader extends Uploader {
  private pendingUploads: Map<string, AbortController> = new Map();

  private parseImageUploadPayload(raw: unknown): { url?: string } {
    if (
      raw &&
      typeof raw === 'object' &&
      'success' in raw &&
      (raw as { success: unknown }).success === true &&
      'data' in raw
    ) {
      return (raw as { data: { url?: string } }).data;
    }
    return raw as { url?: string };
  }

  /**
   * 使用 XHR 以便上报 upload progress（fetch 无标准进度事件）
   */
  private uploadImageWithProgress(
    file: File,
    task: UploadTask,
    signal: AbortSignal,
  ): Promise<{ url?: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.getUploadUrl());

      const headers = this.getAuthHeaders();
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      const onAbort = () => xhr.abort();
      signal.addEventListener('abort', onAbort);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          task.progress = Math.round((e.loaded / e.total) * 100);
          this.options.onProgress?.(task);
        }
      };

      xhr.onload = () => {
        signal.removeEventListener('abort', onAbort);
        if (xhr.status >= 200 && xhr.status < 300) {
          let raw: unknown;
          try {
            raw = JSON.parse(xhr.responseText) as unknown;
          } catch {
            reject(new Error('解析上传响应失败'));
            return;
          }
          const payload = this.parseImageUploadPayload(raw);
          if (!payload.url) {
            reject(new Error('上传响应缺少 url'));
            return;
          }
          resolve(payload);
        } else {
          reject(new Error(`上传失败: ${xhr.statusText || String(xhr.status)}`));
        }
      };

      xhr.onerror = () => {
        signal.removeEventListener('abort', onAbort);
        reject(new Error('网络错误'));
      };

      xhr.onabort = () => {
        signal.removeEventListener('abort', onAbort);
        const err = new Error('上传已取消');
        err.name = 'AbortError';
        reject(err);
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  /**
   * 上传文件
   */
  async upload(file: File): Promise<UploadTask> {
    this.validateFile(file);

    const task = this.createTask(file);
    task.type = getFileType(file);
    task.status = UploadStatus.UPLOADING;
    task.progress = 0;
    this.options.onProgress?.(task);

    const controller = new AbortController();
    const pendingKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `u-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    this.pendingUploads.set(pendingKey, controller);

    try {
      const payload = await this.uploadImageWithProgress(
        file,
        task,
        controller.signal,
      );

      task.status = UploadStatus.COMPLETED;
      task.progress = 100;
      task.url = payload.url;
      this.options.onProgress?.(task);
      this.options.onComplete?.(task);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        task.status = UploadStatus.FAILED;
        task.error = '上传已取消';
      } else {
        task.status = UploadStatus.FAILED;
        task.error = error instanceof Error ? error.message : '未知错误';
        this.options.onError?.(task, error as Error);
      }
    } finally {
      this.pendingUploads.delete(pendingKey);
    }

    return task;
  }

  /**
   * 暂停上传（普通上传不支持暂停）
   */
  pause(taskId: string): void {
    const controller = this.pendingUploads.get(taskId);
    if (controller) {
      controller.abort();
      this.pendingUploads.delete(taskId);
    }
  }

  /**
   * 恢复上传（普通上传不支持恢复）
   */
  async resume(_taskId: string): Promise<UploadTask> {
    throw new Error('普通上传不支持断点续传，请重新上传');
  }

  /**
   * 取消上传
   */
  cancel(taskId: string): void {
    this.pause(taskId);
  }

  /**
   * 查询上传状态
   */
  async queryStatus(_taskId: string): Promise<UploadTask> {
    return this.createTask(new File([], ''));
  }

  /**
   * 批量上传
   */
  async uploadBatch(files: File[]): Promise<UploadTask[]> {
    return Promise.all(files.map((file) => this.upload(file)));
  }

  /**
   * 获取上传 URL
   */
  private getUploadUrl(): string {
    const baseUrl = this.options.baseUrl ?? '';
    switch (this.options.type) {
      case FileType.IMAGE: {
        const params = new URLSearchParams();
        const bp = this.options.imageBusinessPath?.trim();
        if (bp && bp.length > 0) {
          params.set('businessPath', bp);
        }
        if (this.options.imageMarkdownResponse) {
          params.set('markdown', '1');
        }
        const qs = params.toString();
        return `${baseUrl}/api/upload/image${qs ? `?${qs}` : ''}`;
      }
      case FileType.VIDEO:
      case FileType.FILE:
        throw new Error('视频与通用文件请使用分片上传（ChunkUploader）');
      default:
        return `${baseUrl}/api/upload/image`;
    }
  }

}

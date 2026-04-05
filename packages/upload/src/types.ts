/**
 * 文件类型枚举
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

/**
 * 上传任务状态
 */
export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 上传任务
 */
export interface UploadTask {
  id: string;
  file: File;
  type: FileType;
  status: UploadStatus;
  progress: number;
  url?: string;
  error?: string;
  chunks?: number[];
  totalChunks?: number;
  uploadedBytes?: number;
}

/**
 * 上传配置
 */
export interface UploadOptions {
  type: FileType;
  /** API 根（如 '' 表示同源 /api） */
  baseUrl?: string;
  /**
   * localStorage 中 JWT 的 key；不填则依次尝试 user-token、access_token
   */
  authTokenStorageKey?: string;
  /** 分片上传资源类型（默认由 type 推导：video→video，否则→file） */
  chunkKind?: 'video' | 'file';
  /** 图片直传时 query.businessPath，默认由后端使用 common */
  imageBusinessPath?: string;
  /** 图片上传带 markdown=1，后端返回编辑器格式（success/url/message） */
  imageMarkdownResponse?: boolean;
  chunkSize?: number;
  concurrency?: number;
  maxSize?: number;
  allowedTypes?: string[];
  retries?: number;
  onProgress?: (task: UploadTask) => void;
  onComplete?: (task: UploadTask) => void;
  onError?: (task: UploadTask, error: Error) => void;
}

/**
 * 上传状态（持久化到 localStorage）
 */
export interface UploadState {
  taskId: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  status: UploadStatus;
  type: FileType;
}

/**
 * 预览项
 */
export interface PreviewItem {
  url: string;
  type: FileType;
  name?: string;
}

/**
 * 初始化上传响应
 */
export interface InitUploadResponse {
  uploadId: string;
  skipUpload: boolean;
  url?: string;
}

/**
 * 上传分片响应
 */
export interface UploadChunkResponse {
  uploadedChunks: number[];
  progress: number;
}

/**
 * 查询状态响应
 */
export interface UploadStatusResponse {
  uploadedChunks: number[];
  totalChunks: number;
  progress: number;
}

/**
 * 上传常量配置
 */

// 默认分片大小 2MB
export const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024;

// 最大并发上传数
export const DEFAULT_CONCURRENCY = 3;

// 默认最大文件大小（2 GiB，与后端 VIDEO_MAX_SIZE 默认一致）
export const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 * 1024;

// 允许的图片类型
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 允许的视频类型
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

// localStorage key 前缀
export const STORAGE_KEY_PREFIX = 'upload:';

// 重试次数
export const DEFAULT_RETRIES = 3;

// 重试延迟 (ms)
export const RETRY_DELAY = 1000;

import * as SparkMD5 from 'spark-md5';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../constants';
import { FileType } from '../types';

/**
 * 计算文件的 MD5 hash（分片计算，避免大文件卡顿）
 */
export async function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const chunkSize = 2 * 1024 * 1024; // 2MB per chunk
    let offset = 0;

    reader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
        offset += chunkSize;

        if (offset < file.size) {
          readNextChunk();
        } else {
          resolve(spark.end());
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file for MD5 calculation'));
    };

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
  });
}

/**
 * 将文件分片
 */
export function sliceFile(file: File, chunkSize: number): Blob[] {
  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
}

/**
 * 根据文件名获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * 判断文件类型
 */
export function getFileType(file: File): FileType {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return FileType.IMAGE;
  }
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return FileType.VIDEO;
  }
  return FileType.FILE;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  allowedTypes?: string[],
): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true;
  }
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  file: File,
  maxSize: number,
): boolean {
  return file.size <= maxSize;
}

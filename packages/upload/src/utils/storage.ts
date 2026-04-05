import { STORAGE_KEY_PREFIX } from '../constants';
import type { UploadState } from '../types';
import { UploadStatus } from '../types';

/**
 * 获取 localStorage key
 */
function getKey(taskId: string): string {
  return `${STORAGE_KEY_PREFIX}${taskId}`;
}

/**
 * 保存上传状态到 localStorage
 */
export function saveUploadState(state: UploadState): void {
  try {
    localStorage.setItem(getKey(state.taskId), JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save upload state:', error);
  }
}

/**
 * 获取上传状态
 */
export function getUploadState(taskId: string): UploadState | null {
  try {
    const data = localStorage.getItem(getKey(taskId));
    if (data) {
      return JSON.parse(data) as UploadState;
    }
  } catch (error) {
    console.error('Failed to get upload state:', error);
  }
  return null;
}

/**
 * 删除上传状态
 */
export function removeUploadState(taskId: string): void {
  try {
    localStorage.removeItem(getKey(taskId));
  } catch (error) {
    console.error('Failed to remove upload state:', error);
  }
}

/**
 * 获取所有未完成的uploadId列表
 */
export function getPendingUploadIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const taskId = key.slice(STORAGE_KEY_PREFIX.length);
        ids.push(taskId);
      }
    }
  } catch (error) {
    console.error('Failed to get pending upload ids:', error);
  }
  return ids;
}

/**
 * 获取所有未完成的upload状态
 */
export function getAllPendingUploads(): UploadState[] {
  const uploads: UploadState[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const state = JSON.parse(data) as UploadState;
          if (state.status === UploadStatus.UPLOADING || state.status === UploadStatus.PAUSED) {
            uploads.push(state);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to get pending uploads:', error);
  }
  return uploads;
}

/**
 * 更新分片上传进度
 */
export function updateChunkProgress(
  taskId: string,
  uploadedChunks: number[],
): void {
  const state = getUploadState(taskId);
  if (state) {
    state.uploadedChunks = uploadedChunks;
    saveUploadState(state);
  }
}

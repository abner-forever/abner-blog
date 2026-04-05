import * as SparkMD5 from 'spark-md5';
import { FileType, SimpleUploader, UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '@services/simpleImageUploader';
import { CHUNK_SIZE } from '../constants';
import type { MediaItem } from '../types';

/** 与文件内容绑定，用于刷新页面后复用同一 uploadId（断点续传） */
const VIDEO_RESUME_KEY_PREFIX = 'upload:video-resume:';

const videoResumeStorageKey = (fileHash: string, fileSize: number) =>
  `${VIDEO_RESUME_KEY_PREFIX}${fileHash}:${fileSize}`;

const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
        offset += CHUNK_SIZE;
        if (offset < file.size) {
          readNextChunk();
        } else {
          resolve(spark.end());
        }
      }
    };

    reader.onerror = reject;

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
  });
};

const initChunkUpload = async (
  filename: string,
  fileSize: number,
  fileHash: string,
  totalChunks: number,
  mimeType: string,
) => {
  const token = localStorage.getItem('user-token');
  const response = await fetch('/api/upload/chunk/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      kind: 'video',
      businessPath: 'notes',
      filename,
      fileSize,
      fileHash,
      totalChunks,
      mimeType,
    }),
  });
  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message || '初始化上传失败');
};

const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  totalChunks: number,
) => {
  const token = localStorage.getItem('user-token');
  const formData = new FormData();
  formData.append('file', chunk);
  formData.append('uploadId', uploadId);
  formData.append('chunkIndex', String(chunkIndex));
  formData.append('totalChunks', String(totalChunks));

  const response = await fetch('/api/upload/chunk', {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });
  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message || '分片上传失败');
};

const mergeChunks = async (uploadId: string) => {
  const token = localStorage.getItem('user-token');
  const response = await fetch('/api/upload/chunk/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ uploadId }),
  });
  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message || '合并分片失败');
};

type ChunkStatusPayload = {
  uploadedChunks: number[];
  totalChunks: number;
  progress: number;
};

const getChunkUploadStatus = async (
  uploadId: string,
): Promise<ChunkStatusPayload | null> => {
  const token = localStorage.getItem('user-token');
  const response = await fetch(`/api/upload/chunk/status/${uploadId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    return null;
  }
  return data.data as ChunkStatusPayload;
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** 秒传成功前至少展示一段时间，时长随机避免观感死板 */
const ensureMinInitialProgressDisplay = async (
  startTime: number,
  minMs: number,
) => {
  const elapsed = performance.now() - startTime;
  const remain = minMs - elapsed;
  if (remain > 0) {
    await wait(remain);
  }
};

/** 秒传：从当前假进度平滑走到 100%，避免一帧跳变导致「闪没」 */
const INSTANT_UPLOAD_FINISH_MS = 3000;

const animateInstantUploadToComplete = (
  itemId: string,
  onProgress: (id: string, progress: number) => void,
  fromPercent: number,
): Promise<void> => {
  const from = Math.min(99, Math.max(1, Math.round(fromPercent)));
  const start = performance.now();

  return new Promise((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / INSTANT_UPLOAD_FINISH_MS);
      const eased = easeOutQuad(t);
      const p = Math.round(from + (100 - from) * eased);
      onProgress(itemId, p);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onProgress(itemId, 100);
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
};

/**
 * 预检阶段假进度：随机时长缓升到 4～7%，再以随机间隔「蠕动」到 12～18%，避免卡在 5% 不动。
 * lastFakeRef 供真实分片进度与之取 max，防止进度回跳。
 */
const runFakeInitialProgress = (
  itemId: string,
  onProgress: (id: string, progress: number) => void,
  lastFakeRef: { value: number },
): (() => void) => {
  const phase1Ms = randomBetween(3200, 6200);
  const phase1Target = Math.round(randomBetween(4, 7));
  const phase2Ceil = Math.round(
    randomBetween(Math.max(phase1Target + 5, 12), 18),
  );

  const start = performance.now();
  let rafId = 0;
  let phase2TimeoutId = 0;
  let cancelled = false;
  let phase2Started = false;

  const emit = (p: number) => {
    const v = Math.min(phase2Ceil, Math.max(0, Math.round(p)));
    lastFakeRef.value = v;
    onProgress(itemId, v);
  };

  const runPhase2 = () => {
    if (cancelled || lastFakeRef.value >= phase2Ceil) return;
    const step = Math.random() < 0.72 ? 1 : 2;
    emit(lastFakeRef.value + step);
    phase2TimeoutId = window.setTimeout(
      runPhase2,
      randomBetween(280, 920),
    );
  };

  const step = (now: number) => {
    if (cancelled) return;
    const elapsed = now - start;
    if (elapsed < phase1Ms) {
      const t = elapsed / phase1Ms;
      emit(easeOutQuad(t) * phase1Target);
      rafId = requestAnimationFrame(step);
    } else if (!phase2Started) {
      phase2Started = true;
      emit(phase1Target);
      phase2TimeoutId = window.setTimeout(runPhase2, randomBetween(200, 650));
    }
  };

  rafId = requestAnimationFrame(step);

  return () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    window.clearTimeout(phase2TimeoutId);
  };
};

const uploadVideo = async (
  item: MediaItem,
  onProgress: (id: string, progress: number) => void,
): Promise<string> => {
  if (!item.file) return item.url;

  const file = item.file;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fakeProgressStartTime = performance.now();
  const minInstantProgressDisplayMs = randomBetween(2200, 4000);
  const lastFakeProgressRef = { value: 0 };
  const stopFakeInitialProgress = runFakeInitialProgress(
    item.id,
    onProgress,
    lastFakeProgressRef,
  );

  let fileHash: string;
  let resumeKey: string;
  let uploadId: string | null = null;
  const uploadedSet = new Set<number>();

  try {
    fileHash = await calculateFileHash(file);
    resumeKey = videoResumeStorageKey(fileHash, file.size);

    const rawResume = localStorage.getItem(resumeKey);
    if (rawResume) {
      try {
        const { uploadId: previousId } = JSON.parse(rawResume) as {
          uploadId: string;
        };
        const status = await getChunkUploadStatus(previousId);
        if (status && status.totalChunks === totalChunks) {
          uploadId = previousId;
          status.uploadedChunks.forEach((i) => uploadedSet.add(i));
        } else {
          localStorage.removeItem(resumeKey);
        }
      } catch {
        localStorage.removeItem(resumeKey);
      }
    }

    if (!uploadId) {
      const initResult = await initChunkUpload(
        file.name,
        file.size,
        fileHash,
        totalChunks,
        file.type,
      );
      if (initResult.skipUpload && initResult.url) {
        await ensureMinInitialProgressDisplay(
          fakeProgressStartTime,
          minInstantProgressDisplayMs,
        );
        stopFakeInitialProgress();
        await animateInstantUploadToComplete(
          item.id,
          onProgress,
          lastFakeProgressRef.value,
        );
        localStorage.removeItem(resumeKey);
        return initResult.url;
      }
      uploadId = initResult.uploadId;
      localStorage.setItem(resumeKey, JSON.stringify({ uploadId }));
    } else {
      localStorage.setItem(resumeKey, JSON.stringify({ uploadId }));
    }
  } catch (e) {
    stopFakeInitialProgress();
    throw e;
  }

  if (!uploadId) {
    stopFakeInitialProgress();
    throw new Error('视频分片上传初始化失败');
  }

  stopFakeInitialProgress();
  const reportProgress = () => {
    const real = Math.round((uploadedSet.size / totalChunks) * 100);
    const v = Math.max(lastFakeProgressRef.value, real);
    lastFakeProgressRef.value = v;
    onProgress(item.id, v);
  };
  reportProgress();

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedSet.has(i)) {
      continue;
    }
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    await uploadChunk(uploadId, i, chunk, totalChunks);
    uploadedSet.add(i);
    reportProgress();
  }

  try {
    const mergeResult = await mergeChunks(uploadId);
    localStorage.removeItem(resumeKey);
    return mergeResult.url;
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('已上传完成')) {
      localStorage.removeItem(resumeKey);
      const again = await initChunkUpload(
        file.name,
        file.size,
        fileHash,
        totalChunks,
        file.type,
      );
      if (again.skipUpload && again.url) {
        await ensureMinInitialProgressDisplay(
          fakeProgressStartTime,
          minInstantProgressDisplayMs,
        );
        await animateInstantUploadToComplete(
          item.id,
          onProgress,
          lastFakeProgressRef.value,
        );
        return again.url;
      }
    }
    throw e;
  }
};

export const uploadImages = async (
  images: MediaItem[],
  onProgress?: (id: string, progress: number) => void,
): Promise<string[]> => {
  if (images.length === 0) return [];

  return Promise.all(
    images.map(async (img) => {
      if (!img.file) {
        return img.url;
      }
      const uploader = new SimpleUploader({
        type: FileType.IMAGE,
        baseUrl: '',
        imageBusinessPath: 'notes',
        onProgress: (task) => onProgress?.(img.id, task.progress),
      });
      const task = await uploader.upload(img.file);
      if (task.status !== UploadStatus.COMPLETED || !task.url) {
        throw new Error(task.error || '图片上传失败');
      }
      return task.url;
    }),
  );
};

export const uploadVideos = async (
  videos: MediaItem[],
  onProgress: (id: string, progress: number) => void,
): Promise<string[]> => {
  if (videos.length === 0) return [];

  const uploadedUrls: string[] = [];
  for (const video of videos) {
    const url = await uploadVideo(video, onProgress);
    uploadedUrls.push(url);
  }
  return uploadedUrls;
};

export const uploadVideoCover = async (
  videos: MediaItem[],
): Promise<string | undefined> => {
  const videoCover = videos.find((v) => v.coverFile)?.coverFile;
  if (!videoCover) return undefined;

  const task = await createSimpleImageUploader('notes').upload(videoCover);
  if (task.status !== UploadStatus.COMPLETED || !task.url) {
    throw new Error(task.error || '封面上传失败');
  }
  return task.url;
};

export const calculateTotalProgress = (
  media: MediaItem[],
  images: MediaItem[],
  videos: MediaItem[],
  uploadingItems: Map<string, number>,
) => {
  if (media.length === 0) return 0;

  let totalItems = 0;
  let completedItems = 0;
  let totalProgress = 0;

  images.forEach((img) => {
    totalItems++;
    if (!img.file) {
      totalProgress += 100;
      completedItems++;
      return;
    }
    const progress = uploadingItems.get(img.id);
    if (progress !== undefined) {
      totalProgress += progress;
      if (progress >= 100) completedItems++;
    }
  });

  videos.forEach((video) => {
    totalItems++;
    if (!video.file) {
      totalProgress += 100;
      completedItems++;
      return;
    }
    const progress = uploadingItems.get(video.id);
    if (progress !== undefined) {
      totalProgress += progress;
      if (progress >= 100) completedItems++;
    }
  });

  if (completedItems < totalItems) {
    return totalItems > 0 ? Math.round(totalProgress / totalItems) : 0;
  }

  return 100;
};

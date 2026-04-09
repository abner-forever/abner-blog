import {
  ChunkUploader,
  FileType,
  SimpleUploader,
  UploadStatus,
} from '@abner-blog/upload';
import type { MediaItem } from '../types';

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

  const fakeProgressStartTime = performance.now();
  const minInstantProgressDisplayMs = randomBetween(2200, 4000);
  const lastFakeProgressRef = { value: 0 };
  const stopFakeInitialProgress = runFakeInitialProgress(
    item.id,
    onProgress,
    lastFakeProgressRef,
  );
  let fakeStopped = false;
  let hasRealUploadProgress = false;
  const stopFakeOnce = () => {
    if (fakeStopped) return;
    fakeStopped = true;
    stopFakeInitialProgress();
  };

  try {
    const uploader = new ChunkUploader({
      type: FileType.VIDEO,
      baseUrl: '',
      chunkBusinessPath: 'notes',
      // 当前后端分片状态写入对高并发不稳定，创建笔记场景先串行上传避免 merge 400
      concurrency: 1,
      onProgress: (task) => {
        if (task.progress > 0) {
          hasRealUploadProgress = true;
          // 对齐旧逻辑：进入真实分片上传后，立即停止假进度
          stopFakeOnce();
        }
        // 上传中最高只展示到 99%，避免先到 100 后又被完成动画拉回造成闪烁
        const runtimeProgress = task.progress >= 100 ? 99 : task.progress;
        const v = Math.max(lastFakeProgressRef.value, runtimeProgress);
        lastFakeProgressRef.value = v;
        onProgress(item.id, v);
      },
    });
    const task = await uploader.upload(item.file);
    stopFakeOnce();
    if (task.status === UploadStatus.COMPLETED && task.url) {
      if (!hasRealUploadProgress) {
        // 秒传：保持旧体验，走最小时长 + 收尾动画
        await ensureMinInitialProgressDisplay(
          fakeProgressStartTime,
          minInstantProgressDisplayMs,
        );
        await animateInstantUploadToComplete(
          item.id,
          onProgress,
          lastFakeProgressRef.value,
        );
      } else {
        // 普通分片上传：直接完成，不重复做收尾动画，避免“二次加载感”
        onProgress(item.id, 100);
      }
      return task.url;
    }
    throw new Error(task.error || '视频上传失败');
  } catch (e) {
    stopFakeOnce();
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

  const uploader = new SimpleUploader({
    type: FileType.IMAGE,
    baseUrl: '',
    imageBusinessPath: 'notes',
  });
  const task = await uploader.upload(videoCover);
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
    if (totalItems <= 0) return 0;
    // 未全部完成时，进度最多展示到 99，避免四舍五入到 100 后又回落造成闪烁
    const avg = Math.floor(totalProgress / totalItems);
    return Math.min(99, avg);
  }

  return 100;
};

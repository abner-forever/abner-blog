import type { MediaItem } from '../types';

const createMediaId = () => Date.now() + Math.random().toString(36).substring(2, 11);

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const readImageFile = (file: File): Promise<MediaItem> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const img = new globalThis.Image();

    img.onload = () => {
      reader.readAsDataURL(file);
    };

    reader.onload = (event) => {
      resolve({
        id: createMediaId(),
        url: event.target?.result as string,
        file,
        width: img.width,
        height: img.height,
      });
    };

    reader.onerror = () => {
      resolve({
        id: createMediaId(),
        url: reader.result as string,
        file,
      });
    };

    reader.readAsDataURL(file);
  });
};

export const readVideoFile = (file: File): Promise<MediaItem> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      const coverFile = dataURLtoFile(thumbnail, `cover_${file.name}.jpg`);

      resolve({
        id: createMediaId(),
        url: thumbnail,
        file,
        coverFile,
        isVideo: true,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        originalUrl: url,
      });
    };

    video.onerror = () => {
      resolve({
        id: createMediaId(),
        url,
        file,
        isVideo: true,
        originalUrl: url,
      });
    };
  });
};

/**
 * 图片 MIME 类型
 */
export type ChatImageDtoMimeType =
  (typeof ChatImageDtoMimeType)[keyof typeof ChatImageDtoMimeType];

export const ChatImageDtoMimeType = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpg",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
} as const;

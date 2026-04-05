/**
 * 资源类型：视频或通用文件
 */
export type InitChunkUploadDtoKind =
  (typeof InitChunkUploadDtoKind)[keyof typeof InitChunkUploadDtoKind];

export const InitChunkUploadDtoKind = {
  video: "video",
  file: "file",
} as const;

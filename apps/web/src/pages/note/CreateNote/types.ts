export interface MediaItem {
  id: string;
  url: string;
  file?: File;
  coverFile?: File;
  isVideo?: boolean;
  progress?: number;
  width?: number;
  height?: number;
  duration?: number;
  originalUrl?: string;
}

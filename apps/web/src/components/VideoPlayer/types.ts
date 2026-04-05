import type { CSSProperties } from 'react';

/**
 * 视频播放器受控模式 Props
 */
export interface VideoPlayerProps {
  /** 视频资源地址 */
  src: string;
  /** 封面图地址 */
  poster?: string;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** 是否静音 */
  muted?: boolean;
  /** 音量 0-1 */
  volume?: number;
  /** 受控播放状态 */
  playing?: boolean;
  /** 是否显示控制栏 */
  showControls?: boolean;
  /**  классName */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
  /** 播放事件回调 */
  onPlay?: () => void;
  /** 暂停事件回调 */
  onPause?: () => void;
  /** 播放结束回调 */
  onEnded?: () => void;
  /** 进度更新回调 */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** 音量变化回调 */
  onVolumeChange?: (volume: number, muted: boolean) => void;
  /** 播放状态变化回调 */
  onPlayingChange?: (playing: boolean) => void;
  /** 视频加载完成回调 */
  onLoadedMetadata?: (duration: number, videoWidth: number, videoHeight: number) => void;
}

/**
 * 视频播放器命令式 API
 */
export interface VideoPlayerRef {
  /** 播放 */
  play: () => void;
  /** 暂停 */
  pause: () => void;
  /** 切换播放/暂停 */
  toggle: () => void;
  /** 跳转到指定时间 */
  seek: (time: number) => void;
  /** 设置音量 */
  setVolume: (volume: number) => void;
  /** 切换静音 */
  toggleMute: () => void;
  /** 切换全屏 */
  toggleFullscreen: () => void;
  /** 获取当前播放时间 */
  getCurrentTime: () => number;
  /** 获取视频总时长 */
  getDuration: () => number;
  /** 是否正在播放 */
  isPlaying: () => boolean;
}

/**
 * 播放器内部状态
 */
export interface VideoPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  isLoading: boolean;
  videoWidth: number;
  videoHeight: number;
}

import { useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import type { VideoPlayerRef, VideoPlayerState } from './types';

export interface UseVideoPlayerOptions {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlayingChange?: (playing: boolean) => void;
  onLoadedMetadata?: (duration: number, videoWidth: number, videoHeight: number) => void;
}

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  state: VideoPlayerState;
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onEnded: () => void;
    onTimeUpdate: () => void;
    onLoadedMetadata: () => void;
    onWaiting: () => void;
    onCanPlay: () => void;
    onProgress: () => void;
  };
  actions: {
    play: () => void;
    pause: () => void;
    toggle: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => void;
    showControls: () => void;
  };
}

const useVideoPlayer = (
  {
    src,
    autoPlay = false,
    muted = false,
    volume: controlledVolume,
    playing: controlledPlaying,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onVolumeChange,
    onPlayingChange,
    onLoadedMetadata,
  }: UseVideoPlayerOptions,
  ref?: React.Ref<VideoPlayerRef>
): UseVideoPlayerReturn => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<VideoPlayerState>({
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: controlledVolume ?? 1,
      muted: muted,
      isFullscreen: false,
      showControls: true,
      isLoading: false,
      videoWidth: 0,
      videoHeight: 0,
    });
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 同步受控播放状态
    useEffect(() => {
      if (controlledPlaying !== undefined) {
        if (controlledPlaying && videoRef.current) {
          videoRef.current.play().catch(() => {});
        } else if (!controlledPlaying && videoRef.current) {
          videoRef.current.pause();
        }
      }
    }, [controlledPlaying]);

    // 同步受控音量
    useEffect(() => {
      if (controlledVolume !== undefined && videoRef.current) {
        videoRef.current.volume = controlledVolume;
        setState((prev) => ({ ...prev, volume: controlledVolume }));
      }
    }, [controlledVolume]);

    // 静音状态同步
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = muted;
        setState((prev) => ({ ...prev, muted }));
      }
    }, [muted]);

    const play = useCallback(() => {
      videoRef.current?.play().catch(() => {});
    }, []);

    const pause = useCallback(() => {
      videoRef.current?.pause();
    }, []);

    const toggle = useCallback(() => {
      if (state.playing) {
        pause();
      } else {
        play();
      }
    }, [state.playing, play, pause]);

    const seek = useCallback((time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setState((prev) => ({ ...prev, currentTime: time }));
      }
    }, []);

    const setVolume = useCallback(
      (vol: number) => {
        if (videoRef.current) {
          videoRef.current.volume = vol;
          const newMuted = vol === 0;
          setState((prev) => ({ ...prev, volume: vol, muted: newMuted }));
          onVolumeChange?.(vol, newMuted);
        }
      },
      [onVolumeChange]
    );

    const toggleMute = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        const newMuted = videoRef.current.muted;
        setState((prev) => ({ ...prev, muted: newMuted }));
        onVolumeChange?.(state.volume, newMuted);
      }
    }, [state.volume, onVolumeChange]);

    const toggleFullscreen = useCallback(async () => {
      if (!containerRef.current) return;

      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setState((prev) => ({ ...prev, isFullscreen: true }));
        } else {
          await document.exitFullscreen();
          setState((prev) => ({ ...prev, isFullscreen: false }));
        }
      } catch {
        // 浏览器或环境不支持全屏时静默处理，避免打断用户操作
      }
    }, []);

    const getCurrentTime = useCallback(() => {
      return videoRef.current?.currentTime ?? 0;
    }, []);

    const getDuration = useCallback(() => {
      return videoRef.current?.duration ?? 0;
    }, []);

    const isPlaying = useCallback(() => {
      return state.playing;
    }, [state.playing]);

    // 暴露命令式 API
    useImperativeHandle(ref, () => ({
      play,
      pause,
      toggle,
      seek,
      setVolume,
      toggleMute,
      toggleFullscreen,
      getCurrentTime,
      getDuration,
      isPlaying,
    }));

    // 视频事件处理
    const handlePlay = useCallback(() => {
      setState((prev) => ({ ...prev, playing: true }));
      onPlay?.();
      onPlayingChange?.(true);
    }, [onPlay, onPlayingChange]);

    const handlePause = useCallback(() => {
      setState((prev) => ({ ...prev, playing: false }));
      onPause?.();
      onPlayingChange?.(false);
    }, [onPause, onPlayingChange]);

    const handleEnded = useCallback(() => {
      setState((prev) => ({ ...prev, playing: false }));
      onEnded?.();
      onPlayingChange?.(false);
    }, [onEnded, onPlayingChange]);

    const handleTimeUpdate = useCallback(() => {
      if (videoRef.current) {
        setState((prev) => ({
          ...prev,
          currentTime: videoRef.current!.currentTime,
        }));
        onTimeUpdate?.(videoRef.current!.currentTime, videoRef.current!.duration);
      }
    }, [onTimeUpdate]);

    const handleLoadedMetadata = useCallback(() => {
      if (videoRef.current) {
        setState((prev) => ({
          ...prev,
          duration: videoRef.current!.duration,
          videoWidth: videoRef.current!.videoWidth,
          videoHeight: videoRef.current!.videoHeight,
        }));
        onLoadedMetadata?.(
          videoRef.current!.duration,
          videoRef.current!.videoWidth,
          videoRef.current!.videoHeight
        );
      }
    }, [onLoadedMetadata]);

    const handleWaiting = useCallback(() => {
      setState((prev) => ({ ...prev, isLoading: true }));
    }, []);

    const handleCanPlay = useCallback(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
    }, []);

    const handleProgress = useCallback(() => {}, []);

    // 全屏变化监听
    useEffect(() => {
      const handleFullscreenChange = () => {
        setState((prev) => ({
          ...prev,
          isFullscreen: !!document.fullscreenElement,
        }));
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, []);

    // 自动播放
    useEffect(() => {
      if (autoPlay && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, [autoPlay, src]);

    // 自动隐藏控制栏
    const showControls = useCallback(() => {
      setState((prev) => ({ ...prev, showControls: true }));
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (state.playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, showControls: false }));
        }, 3000);
      }
    }, [state.playing]);

    return {
      videoRef,
      containerRef,
      state,
      handlers: {
        onPlay: handlePlay,
        onPause: handlePause,
        onEnded: handleEnded,
        onTimeUpdate: handleTimeUpdate,
        onLoadedMetadata: handleLoadedMetadata,
        onWaiting: handleWaiting,
        onCanPlay: handleCanPlay,
        onProgress: handleProgress,
      },
      actions: {
        play,
        pause,
        toggle,
        seek,
        setVolume,
        toggleMute,
        toggleFullscreen,
        showControls,
      },
    };
  };

export default useVideoPlayer;

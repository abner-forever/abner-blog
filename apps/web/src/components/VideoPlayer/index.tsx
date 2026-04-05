import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlayCircleOutlined } from '@ant-design/icons';
import VideoPlayerControls from './VideoPlayerControls';
import useVideoPlayer from './useVideoPlayer';
import classNames from 'classnames';
import Loading from '@/components/Loading';
import type { VideoPlayerProps, VideoPlayerRef } from './types';
import './index.less';

const VideoPlayer = React.forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      src,
      poster,
      autoPlay = false,
      loop = false,
      muted = false,
      volume = 1,
      playing: controlledPlaying,
      showControls: controlledShowControls,
      className = '',
      style,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onVolumeChange,
      onPlayingChange,
      onLoadedMetadata,
    },
    ref
  ) => {
    const [showPoster, setShowPoster] = useState(!autoPlay);
    const [buffer, setBuffer] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPortraitVideo, setIsPortraitVideo] = useState(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

    const {
      videoRef,
      containerRef,
      state,
      handlers,
      actions,
    } = useVideoPlayer(
      {
        src,
        autoPlay,
        loop,
        muted,
        volume,
        playing: controlledPlaying,
        onPlay,
        onPause,
        onEnded,
        onTimeUpdate,
        onVolumeChange,
        onPlayingChange,
        onLoadedMetadata,
      },
      ref as React.Ref<VideoPlayerRef>
    );

    // 受控显示控制栏
    useEffect(() => {
      if (controlledShowControls !== undefined) {
        setShowControls(controlledShowControls);
      }
    }, [controlledShowControls]);

    // 键盘快捷键
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current?.contains(document.activeElement)) return;

        switch (e.key) {
          case ' ':
            e.preventDefault();
            actions.toggle();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            actions.seek(state.currentTime - 5);
            break;
          case 'ArrowRight':
            e.preventDefault();
            actions.seek(state.currentTime + 5);
            break;
          case 'ArrowUp':
            e.preventDefault();
            actions.setVolume(Math.min(1, state.volume + 0.1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            actions.setVolume(Math.max(0, state.volume - 0.1));
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            actions.toggleFullscreen();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            actions.toggleMute();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [actions, state.currentTime, state.volume, containerRef]);

    // 全屏变化监听
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, [containerRef]);

    // 自动隐藏控制栏
    const resetControlsTimeout = useCallback(() => {
      if (controlledShowControls === undefined) {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        if (state.playing) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
    }, [state.playing, controlledShowControls]);

    // 显示控制栏
    const handleMouseMove = useCallback(() => {
      resetControlsTimeout();
    }, [resetControlsTimeout]);

    // 双击手势（移动端）
    const handleDoubleTap = useCallback(
      (clientX: number) => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const relativeX = clientX - containerRect.left;
        const containerWidth = containerRect.width;
        const seekAmount = 10;

        if (relativeX < containerWidth * 0.3) {
          // 快退
          actions.seek(Math.max(0, state.currentTime - seekAmount));
        } else if (relativeX > containerWidth * 0.7) {
          // 快进
          actions.seek(Math.min(state.duration, state.currentTime + seekAmount));
        } else {
          // 切换播放/暂停
          actions.toggle();
        }
      },
      [actions, state.currentTime, state.duration, containerRef]
    );

    // 点击处理（区分单击和双击）
    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const now = Date.now();
        const touch = e.changedTouches[0];
        const tap = { time: now, x: touch.clientX };

        if (
          lastTapRef.current.time > 0 &&
          now - lastTapRef.current.time < 300 &&
          Math.abs(tap.x - lastTapRef.current.x) < 50
        ) {
          // 双击
          handleDoubleTap(tap.x);
          lastTapRef.current = { time: 0, x: 0 };
        } else {
          // 单击 - 延迟等待双击
          lastTapRef.current = tap;
          setTimeout(() => {
            if (lastTapRef.current.time === tap.time) {
              // 没有双击发生，切换控制栏显示
              if (state.playing) {
                setShowControls((prev) => !prev);
              } else {
                setShowControls(true);
              }
            }
          }, 300);
        }
      },
      [handleDoubleTap, state.playing]
    );

    // 播放/暂停处理
    const handlePlayPause = useCallback(() => {
      actions.toggle();
    }, [actions]);

    // 封面点击播放
    const handlePosterClick = useCallback(() => {
      setShowPoster(false);
      actions.play();
    }, [actions]);

    // 进度跳转
    const handleSeek = useCallback(
      (time: number) => {
        actions.seek(time);
      },
      [actions]
    );

    // 音量变化
    const handleVolumeChange = useCallback(
      (vol: number) => {
        actions.setVolume(vol);
      },
      [actions]
    );

    // 静音切换
    const handleMuteToggle = useCallback(() => {
      actions.toggleMute();
    }, [actions]);

    // 全屏切换
    const handleFullscreenToggle = useCallback(() => {
      actions.toggleFullscreen();
    }, [actions]);

    // 监听缓冲进度
    const handleProgress = useCallback(() => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffer(bufferedEnd);
      }
    }, [videoRef]);

    const enableRatioAdaptation = controlledShowControls !== false;
    const playerClassName = classNames('videoPlayer', className, {
      'videoPlayerFullscreen': isFullscreen,
      'videoPlayerPortrait': isPortraitVideo,
      'videoPlayerLandscape': !isPortraitVideo,
      'videoPlayerRatioPortrait': enableRatioAdaptation && isPortraitVideo,
      'videoPlayerRatioLandscape': enableRatioAdaptation && !isPortraitVideo,
    });
    const shouldRenderControls = controlledShowControls ?? (showControls || !state.playing);

    useEffect(() => {
      if (state.playing) {
        setShowPoster(false);
      } else if (state.currentTime <= 0.1) {
        setShowPoster(!autoPlay);
      }
    }, [state.playing, state.currentTime, autoPlay]);

    useEffect(() => {
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={playerClassName}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => state.playing && controlledShowControls === undefined && setShowControls(false)}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        aria-label="视频播放器"
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onPlay={handlers.onPlay}
          onPause={handlers.onPause}
          onEnded={handlers.onEnded}
          onTimeUpdate={() => {
            handlers.onTimeUpdate();
            handleProgress();
          }}
          onLoadedMetadata={(event) => {
            const target = event.currentTarget;
            setIsPortraitVideo(target.videoHeight > target.videoWidth);
            handlers.onLoadedMetadata();
          }}
          onWaiting={handlers.onWaiting}
          onCanPlay={handlers.onCanPlay}
          onProgress={handleProgress}
          onClick={() => {
            if (controlledPlaying === undefined) {
              actions.toggle();
            } else if (controlledShowControls === undefined) {
              setShowControls((prev) => !prev);
            }
          }}
        />

        {/* 封面图 + 播放按钮 */}
        <div
          className={`videoPoster ${!showPoster ? 'hidden' : ''}`}
          onClick={handlePosterClick}
        >
          {poster && <img src={poster} alt="video poster" />}
          <div className="playButton">
            <PlayCircleOutlined className="playIcon" />
          </div>
        </div>

        {/* Loading 遮罩 */}
        {state.isLoading && (
          <div className="loadingOverlay">
            <Loading size="small" tip=" " />
          </div>
        )}

        {/* 控制栏 */}
        {shouldRenderControls && (
          <VideoPlayerControls
            playing={state.playing}
            currentTime={state.currentTime}
            duration={state.duration}
            buffer={buffer}
            volume={state.volume}
            muted={state.muted}
            isFullscreen={isFullscreen}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onFullscreenToggle={handleFullscreenToggle}
          />
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

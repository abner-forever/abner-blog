import React from 'react';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import VideoProgress from './VideoProgress';
import VolumeControl from './VolumeControl';

interface VideoPlayerControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffer?: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  playing,
  currentTime,
  duration,
  buffer,
  volume,
  muted,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
}) => {
  return (
    <div className="video-player__controls">
      <div className="video-player__control-area">
        <div className="video-player__control-left">
          <button
            type="button"
            className="video-player__play-pause"
            onClick={onPlayPause}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? (
              <PauseCircleOutlined className="video-player__icon" />
            ) : (
              <PlayCircleOutlined className="video-player__icon" />
            )}
          </button>
        </div>
        <div className="video-player__progress-area">
          <div className="video-player__time">{formatTime(currentTime)}</div>
          <VideoProgress
            currentTime={currentTime}
            duration={duration}
            buffer={buffer}
            onSeek={onSeek}
          />
          <div className="video-player__time">{formatTime(duration)}</div>
        </div>
        <div className="video-player__control-right">
          <VolumeControl
            volume={volume}
            muted={muted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
          />
          <button
            type="button"
            className="video-player__fullscreen-btn"
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
          >
            {isFullscreen ? (
              <CompressOutlined className="video-player__icon" />
            ) : (
              <ExpandOutlined className="video-player__icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerControls;

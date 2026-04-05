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
    <div className="videoControls">
      <div className="controlArea">
        <div className="leftControls">
          <button
            type="button"
            className="playPauseButton"
            onClick={onPlayPause}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? (
              <PauseCircleOutlined className="icon" />
            ) : (
              <PlayCircleOutlined className="icon" />
            )}
          </button>
        </div>
        <div className="progressArea">
          <div className="timeDisplay currentTime">{formatTime(currentTime)}</div>
          <VideoProgress
            currentTime={currentTime}
            duration={duration}
            buffer={buffer}
            onSeek={onSeek}
          />
          <div className="timeDisplay totalTime">{formatTime(duration)}</div>
        </div>
        <div className="rightControls">
          <VolumeControl
            volume={volume}
            muted={muted}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
          />
          <button
            type="button"
            className="fullscreenButton"
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
          >
            {isFullscreen ? (
              <CompressOutlined className="icon" />
            ) : (
              <ExpandOutlined className="icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerControls;

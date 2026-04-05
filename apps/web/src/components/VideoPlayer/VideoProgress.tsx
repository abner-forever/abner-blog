import React, { useRef, useCallback } from 'react';

interface VideoProgressProps {
  currentTime: number;
  duration: number;
  buffer?: number;
  onSeek: (time: number) => void;
}

const VideoProgress: React.FC<VideoProgressProps> = ({
  currentTime,
  duration,
  buffer = 0,
  onSeek,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      if (!progressRef.current) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percent * duration;
    },
    [duration]
  );

  const handleClick = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const time = getTimeFromPosition(e.clientX);
        onSeek(time);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const time = getTimeFromPosition(touch.clientX);
    onSeek(time);

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const time = getTimeFromPosition(touch.clientX);
      onSeek(time);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffer / duration) * 100 : 0;

  return (
    <div
      ref={progressRef}
      className="videoProgress"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="progressBuffer" style={{ width: `${bufferProgress}%` }} />
      <div className="progressPlayed" style={{ width: `${progress}%` }} />
      <div className="progressThumb" style={{ left: `${progress}%` }} />
    </div>
  );
};

export default VideoProgress;

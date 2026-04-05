import React, { useState, useRef } from 'react';
import { SoundOutlined, SoundFilled, MutedOutlined } from '@ant-design/icons';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getVolumeFromPosition = (clientY: number): number => {
    if (!sliderRef.current) return volume;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    return percent;
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    const newVolume = getVolumeFromPosition(e.clientY);
    onVolumeChange(newVolume);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const newVolume = getVolumeFromPosition(e.clientY);
    onVolumeChange(newVolume);

    const handleMouseMove = (e: MouseEvent) => {
      const newVolume = getVolumeFromPosition(e.clientY);
      onVolumeChange(newVolume);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const displayVolume = muted ? 0 : volume;

  const getVolumeIcon = () => {
    if (muted || volume === 0) {
      return <MutedOutlined className="icon" />;
    }
    if (volume < 0.5) {
      return <SoundOutlined className="icon" />;
    }
    return <SoundFilled className="icon" />;
  };

  return (
    <div
      className="volumeControl"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        type="button"
        className="volumeButton"
        onClick={onMuteToggle}
        aria-label={muted || volume === 0 ? '取消静音' : '静音'}
      >
        {getVolumeIcon()}
      </button>
      <div className={`volumeSlider ${isExpanded ? 'expanded' : ''}`}>
        <div
          ref={sliderRef}
          className="sliderTrack"
          onClick={handleSliderClick}
          onMouseDown={handleMouseDown}
        >
          <div className="sliderFill" style={{ height: `${displayVolume * 100}%` }} />
          <div className="sliderThumb" style={{ bottom: `${displayVolume * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;

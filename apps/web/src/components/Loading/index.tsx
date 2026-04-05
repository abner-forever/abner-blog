import React from 'react';
import './index.less';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
  page?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const defaultTips = [
  '🐭 仓鼠正在跑轮子...',
  '🎬 精彩内容即将加载...',
  '☕ 咖啡正在煮...',
  '✨ 魔法生效中...',
  '🚀 准备起飞...',
];

const Loading: React.FC<LoadingProps> = ({
  tip,
  size = 'default',
  fullScreen = false,
  page = false,
  className = '',
  style = {},
}) => {
  const containerClass = `loading-container ${fullScreen ? 'full-screen' : ''} ${page ? 'page-loading' : ''} ${!tip ? 'no-tip' : ''} ${className}`;

  const displayTip =
    tip || defaultTips[Math.floor(Math.random() * defaultTips.length)];

  const containerStyle: React.CSSProperties = {
    ...style,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="loading-content">
        <div className={`hamster-ball ${size}`}>
          <div className="ball-shell">
            <div className="ball-reflection"></div>
          </div>
          <div className="hamster-runner">
            <div className="hamster">
              <div className="hamster-body">
                <div className="hamster-ear ear-left"></div>
                <div className="hamster-ear ear-right"></div>
                <div className="hamster-face">
                  <div className="hamster-eye eye-left"></div>
                  <div className="hamster-eye eye-right"></div>
                  <div className="nose"></div>
                  <div className="mouth"></div>
                </div>
                <div className="cheek cheek-left"></div>
                <div className="cheek cheek-right"></div>
              </div>
              <div className="hamster-legs">
                <div className="leg leg-front"></div>
                <div className="leg leg-back"></div>
              </div>
            </div>
          </div>
          <div className="sparkles">
            <span>💫</span>
            <span>⭐</span>
            <span>✨</span>
            <span>🌟</span>
          </div>
        </div>
        {displayTip && <div className="loading-tip">{displayTip}</div>}
      </div>
    </div>
  );
};

export default Loading;

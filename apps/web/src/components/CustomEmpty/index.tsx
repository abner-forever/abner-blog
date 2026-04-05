import React from 'react';
import './index.less';

interface CustomEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  tip?: string;
  image?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const defaultTips = [
  '🐹 这里空空如也...',
  '🕳️ Nothing here',
  '✨ 还没有内容哦',
  '📭 空空如也',
];

const CustomEmpty: React.FC<CustomEmptyProps> = ({
  tip,
  className = '',
  children,
  ...rest
}) => {
  const displayTip =
    tip || defaultTips[Math.floor(Math.random() * defaultTips.length)];

  return (
    <div className={`custom-empty ${className}`} {...rest}>
      <div className="empty-content">
        <div className="empty-illustration">
          <div className="empty-hamster">
            <div className="hamster-body">
              <div className="hamster-ear ear-left"></div>
              <div className="hamster-ear ear-right"></div>
              <div className="hamster-face">
                <div className="eye-wrapper">
                  <div className="hamster-eye eye-left"></div>
                  <div className="hamster-eye eye-right"></div>
                </div>
                <div className="nose"></div>
                <div className="mouth"></div>
                <div className="cheek cheek-left"></div>
                <div className="cheek cheek-right"></div>
              </div>
            </div>
          </div>
          <div className="empty-stars">
            <span>✨</span>
            <span>⭐</span>
            <span>💫</span>
          </div>
        </div>
        <div className="empty-tip">{displayTip}</div>
      </div>
      {children}
    </div>
  );
};

export default CustomEmpty;

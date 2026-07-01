import React, { useState, useEffect, useRef } from 'react';

interface AnimatedPanelProps {
  visible: boolean;
  children: React.ReactNode;
  animationDuration?: number; // ms, 匹配 CSS 动画时长
  className?: string;
}

/**
 * 带进出场动画的面板包装组件
 * - 进场：挂载时播放 slideInRight
 * - 退场：visible=false 时播放 slideOutRight，结束后自动卸载
 */
const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  visible,
  children,
  animationDuration = 200,
  className = 'knowledge-base-panel-wrapper',
}) => {
  const [mounted, setMounted] = useState(visible);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // 打开：挂载 DOM，播放进场动画（CSS animation 自动播放）
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      // 关闭：触发退场动画
      setExiting(true);
      timerRef.current = setTimeout(() => {
        setExiting(false);
        setMounted(false);
        timerRef.current = null;
      }, animationDuration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // 不依赖 mounted，避免关闭过程中 mounted 变化导致重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className={`${className}${exiting ? ' slide-out' : ''}`}>
      {children}
    </div>
  );
};

export default AnimatedPanel;

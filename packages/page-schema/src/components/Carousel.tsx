/**
 * Carousel 轮播图组件
 *
 * 从 node.props.slides 读取图片 URL 列表
 * 支持 autoplay / interval / indicators
 * 无 slides 时展示空占位
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { BaseComponentProps, CarouselNodeProps } from '../types';

const WRAPPER_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  borderRadius: 8,
  background: '#f5f5f5',
};

const SLIDE_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  transition: 'transform 0.4s ease-in-out',
};

const SLIDE_STYLE: React.CSSProperties = {
  minWidth: '100%',
  height: 300,
  objectFit: 'cover',
  display: 'block',
  userSelect: 'none',
};

const EMPTY_SLIDE_STYLE: React.CSSProperties = {
  minWidth: '100%',
  height: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#999',
  fontSize: 14,
  background: '#fafafa',
};

const NAV_BTN_BASE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.85)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  color: '#333',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  opacity: 0.7,
  transition: 'opacity 0.15s',
};

const DOT_CONTAINER: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 8,
  zIndex: 2,
};

const DOT_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  background: 'rgba(255,255,255,0.5)',
  transition: 'background 0.2s',
};

const DOT_ACTIVE_STYLE: React.CSSProperties = {
  background: '#fff',
  width: 10,
  height: 10,
};

const Carousel: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as CarouselNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { slides: rawSlides, autoplay = true, interval = 3000, indicators = true } = props;
  const slides = rawSlides || [];

  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    const total = slides.length;
    if (total === 0) return;
    setCurrent(((index % total) + total) % total);
  }, [slides.length]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // auto-play
  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    timerRef.current = setInterval(goNext, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, interval, goNext, slides.length]);

  // 鼠标悬停暂停自动播放
  const pause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);
  const resume = useCallback(() => {
    if (!autoplay || slides.length <= 1) return;
    timerRef.current = setInterval(goNext, interval);
  }, [autoplay, interval, goNext, slides.length]);

  if (slides.length === 0) {
    return (
      <div id={node.props.id as string} style={{ ...WRAPPER_STYLE, ...style }}>
        <div style={EMPTY_SLIDE_STYLE}>
          {children || <span>暂无轮播图片</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ ...WRAPPER_STYLE, ...style }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* slides track */}
      <div
        style={{
          ...SLIDE_WRAPPER_STYLE,
          transform: `translateX(-${current * 100}%)`,
        }}
      >
        {slides.map((src, index) => (
          <img key={index} src={src} alt={`slide-${index}`} style={SLIDE_STYLE} loading="lazy" />
        ))}
      </div>

      {/* prev/next buttons */}
      {slides.length > 1 && (
        <>
          <button
            style={{ ...NAV_BTN_BASE, left: 8 }}
            onClick={goPrev}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            ‹
          </button>
          <button
            style={{ ...NAV_BTN_BASE, right: 8 }}
            onClick={goNext}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            ›
          </button>
        </>
      )}

      {/* indicators */}
      {indicators && slides.length > 1 && (
        <div style={DOT_CONTAINER}>
          {slides.map((_, index) => (
            <button
              key={index}
              style={{
                ...DOT_STYLE,
                ...(index === current ? DOT_ACTIVE_STYLE : {}),
              }}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(Carousel);

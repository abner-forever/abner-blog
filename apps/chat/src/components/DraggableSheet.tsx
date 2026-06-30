import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './DraggableSheet.less';

interface DraggableSheetProps {
  /** 是否展示 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 子内容 */
  children: React.ReactNode;
}

const CLOSE_ANIM_MS = 350;

/**
 * 可拖拽底部弹窗 — 带高度塌陷关闭动画。
 *
 * 入场：从底部滑入 + 遮罩淡入（CSS transform 驱动，高性能）。
 * 出场：高度逐渐缩小至 0 + 遮罩淡出（高度塌陷效果）。
 * 拖拽：通过高度压缩实现跟手感，拖拽超过阈值后触发关闭动画。
 */
const DraggableSheet: React.FC<DraggableSheetProps> = ({
  open,
  title,
  onClose,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false); // DOM 挂载状态
  const [entered, setEntered] = useState(false); // 入场动画是否完成
  const [closing, setClosing] = useState(false); // 是否正在执行关闭动画
  const [isAtTop, setIsAtTop] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const closingLockRef = useRef(false); // 防止重复触发关闭动画
  const initialHeightRef = useRef(0); // 拖拽开始时 sheet 高度
  const dragState = useRef({
    active: false,
    startY: 0,
    currentY: 0,
  });

  /* ── 入场控制 ── */
  useEffect(() => {
    if (open) {
      closingLockRef.current = false;
      setMounted(true);
      setClosing(false);
      setEntered(false);

      // 清除关闭动画可能残留的内联样式
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
        sheetRef.current.style.height = '';
        sheetRef.current.style.overflow = '';
        sheetRef.current.style.transform = '';
      }

      // setTimeout 确保浏览器有足够时间绘制初始状态（translateY(100%)），
      // 然后才切换为入场状态触发 CSS transition
      const timer = setTimeout(() => {
        setEntered(true);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [open]);

  /* ── 关闭动画：高度塌陷 ── */
  const startCloseAnimation = useCallback(() => {
    if (closingLockRef.current) return;
    closingLockRef.current = true;
    setClosing(true);
    setEntered(false);

    const sheet = sheetRef.current;
    if (sheet) {
      // 获取当前高度
      const height = sheet.offsetHeight;
      // 清除可能残留的拖拽 transform
      sheet.style.transform = '';
      // 设置定高，为 CSS transition 做准备
      sheet.style.transition = `height ${CLOSE_ANIM_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
      sheet.style.height = `${height}px`;
      sheet.style.overflow = 'hidden';

      // 强制浏览器应用当前定高（void 显式丢弃表达式值，不触发 no-unused-expressions）
      void sheet.offsetHeight;

      // 高度动画到 0
      sheet.style.height = '0';
    }

    // 动画完成后通知父组件关闭
    setTimeout(() => {
      onClose();
    }, CLOSE_ANIM_MS + 30);
  }, [onClose]);

  /* ── 拖拽（高度压缩跟手） ── */
  const handleDragStart = useCallback(
    (clientY: number) => {
      if (!isAtTop) return;
      dragState.current = { active: true, startY: clientY, currentY: clientY };
      setIsDragging(true);

      const sheet = sheetRef.current;
      if (sheet) {
        // 关掉 transition 使拖拽跟手
        sheet.style.transition = 'none';
        sheet.style.transform = '';
        // 记录拖拽起始高度
        initialHeightRef.current = sheet.offsetHeight;
        sheet.style.height = `${initialHeightRef.current}px`;
        sheet.style.overflow = 'hidden';
      }
    },
    [isAtTop],
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!dragState.current.active) return;
      const offset = clientY - dragState.current.startY;
      if (offset > 0) {
        dragState.current.currentY = clientY;
        const sheet = sheetRef.current;
        if (sheet) {
          // 高度随拖拽距离线性减少（带阻尼，避免一下缩到 0）
          const damping = 1.5;
          const compressedHeight = Math.max(
            60,
            initialHeightRef.current - offset / damping,
          );
          sheet.style.height = `${compressedHeight}px`;
        }
      }
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.active) return;
    const offset = dragState.current.currentY - dragState.current.startY;
    const shouldClose = offset > window.innerHeight * 0.25;

    const sheet = sheetRef.current;
    if (shouldClose) {
      setClosing(true);
      setEntered(false);

      if (sheet) {
        // 从当前压缩高度继续动画到 0
        sheet.style.transition = `height ${CLOSE_ANIM_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        sheet.style.height = '0';
      }

      closingLockRef.current = true;
      setTimeout(() => {
        onClose();
      }, CLOSE_ANIM_MS + 30);
    } else {
      // 回弹到原始高度
      if (sheet) {
        sheet.style.transition = 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
        sheet.style.height = '';
        sheet.style.overflow = '';
      }
      setTimeout(() => {
        if (sheet) {
          sheet.style.transition = '';
        }
      }, 400);
    }

    setIsDragging(false);
    dragState.current = { active: false, startY: 0, currentY: 0 };
  }, [onClose]);

  /* ── 事件绑定 ── */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    [handleDragStart],
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    [handleDragMove],
  );
  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      handleDragStart(e.clientY);

      const onMouseMove = (ev: globalThis.MouseEvent) =>
        handleDragMove(ev.clientY);
      const onMouseUp = () => {
        handleDragEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [handleDragStart, handleDragMove, handleDragEnd],
  );

  /* ── 更新 dragging class ── */
  useEffect(() => {
    if (sheetRef.current) {
      if (isDragging) {
        sheetRef.current.classList.add('draggable-sheet--dragging');
      } else {
        sheetRef.current.classList.remove('draggable-sheet--dragging');
      }
    }
  }, [isDragging]);

  /* ── 滚动监听 ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsAtTop(el.scrollTop <= 0);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Escape 键关闭 ── */
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        startCloseAnimation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, startCloseAnimation]);

  /* ── 关闭按钮 ── */
  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startCloseAnimation();
    },
    [startCloseAnimation],
  );

  /* ── 遮罩点击 ── */
  const handleBackdropClick = useCallback(() => {
    startCloseAnimation();
  }, [startCloseAnimation]);

  if (!mounted) return null;

  // wrapper 类名
  const wrapperClass = [
    'draggable-sheet-wrapper',
    entered ? 'sheet--entered' : '',
    closing ? 'sheet--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {/* 遮罩层 */}
      <div
        className="draggable-sheet__backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet 主体 */}
      <div
        ref={sheetRef}
        className={`draggable-sheet${closing ? ' draggable-sheet--closing-anim' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        aria-modal="true"
        role="dialog"
        aria-label={title}
      >
        {/* 拖拽条 */}
        <div className="draggable-sheet__handle" />

        {/* 头部 */}
        <div className="draggable-sheet__header">
          <span className="draggable-sheet__header-title">{title}</span>
          <button
            className="draggable-sheet__header-close"
            onClick={handleCloseClick}
            aria-label="Close"
            type="button"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* 可滚动内容 */}
        <div className="draggable-sheet__body" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DraggableSheet;

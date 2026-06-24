/**
 * Modal 弹窗组件（WYSIWYG 版）
 *
 * 渲染策略变更：不再自动渲染 header/body/footer 结构，
 * 改为将 block HTML 的完整视觉结构直接作为 children 渲染。
 * 实现「编辑区域看到什么，预览就是什么」。
 *
 * 关闭按钮通过在 block 中设置 class="gjs-modal-close" 自动生效，
 * Modal 组件通过 useRef + 原生 DOM 事件监听捕获点击
 * （不使用 data 属性或 React 合成事件，避免 schema 转换丢失属性）。
 *
 * 职责：
 * - Portal 渲染到 document.body（避免父容器干扰）
 * - 遮罩层（overlay）+ 点击关闭
 * - ESC 键关闭
 * - 动画效果（fade/zoom/slide）
 * - 合并 node.props.style 到 content div（保持 block HTML 的样式）
 * - 通过原生 DOM 监听 .gjs-modal-close 点击
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BaseComponentProps, ModalNodeProps } from '../types';

/* ==================== 动画样式 ==================== */

function getAnimationStyle(animation: string, visible: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: 'transform 0.25s ease, opacity 0.25s ease',
  };

  switch (animation) {
    case 'zoom':
      return {
        ...base,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        opacity: visible ? 1 : 0,
      };
    case 'slide':
      return {
        ...base,
        transform: visible ? 'translateY(0)' : 'translateY(-30px)',
        opacity: visible ? 1 : 0,
      };
    case 'fade':
    default:
      return {
        ...base,
        opacity: visible ? 1 : 0,
      };
  }
}

/* ==================== Modal 组件 ==================== */

export interface ModalComponentProps extends BaseComponentProps {
  /** 是否可见（由 ModalProvider 控制） */
  visible?: boolean;
  /** 关闭回调（由 ModalProvider 注入） */
  onClose?: () => void;
}

/**
 * Modal 弹窗运行时组件
 *
 * 通过 Portal 渲染到 document.body，支持：
 * - 三种动画效果（fade/zoom/slide）
 * - 遮罩点击关闭（maskClosable）
 * - ESC 键关闭
 * - block 中 .gjs-modal-close 元素点击自动关闭（原生 DOM 事件委托）
 *
 * 注意：不再自动渲染 header/body/footer 结构，
 * block 的完整 HTML 作为 children 直接渲染 → 完全的所见即所得。
 * block 的 inline style 通过 node.props.style 合并到 content div。
 */
const Modal: React.FC<ModalComponentProps> = ({ node, children, visible = false, onClose }) => {
  const props = node.props as ModalNodeProps;
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const {
    width = 520,
    maskClosable = true,
    keyboard = true,
    animation = 'fade',
  } = props;

  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && keyboard && visible) {
        e.preventDefault();
        onClose?.();
      }
    },
    [keyboard, visible, onClose],
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, handleKeyDown]);

  // 遮罩点击关闭
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && maskClosable) {
        onClose?.();
      }
    },
    [maskClosable, onClose],
  );

  /* ---- 原生 DOM 事件委托：监听 .gjs-modal-close 点击 ---- */

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleNativeClick = (e: MouseEvent) => {
      // 检查被点击元素或其祖先是否有 .gjs-modal-close 选择器
      const target = e.target as HTMLElement;
      if (target.closest('.gjs-modal-close')) {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };

    // 在捕获阶段监听，确保优先于 content 上的 React 合成事件
    el.addEventListener('click', handleNativeClick, true);
    return () => el.removeEventListener('click', handleNativeClick, true);
  }, []);  // 空依赖：仅挂载/卸载一次，通过 ref 获取最新的 onClose

  // 弹窗宽度
  const modalWidth = typeof width === 'number' ? `${width}px` : width;

  // 动画样式
  const animStyle = getAnimationStyle(animation, visible);

  // 显式构建 overlay 样式
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.45)',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: 'opacity 0.25s ease',
  };

  // 显式构建 content 样式，不使用对象 spread 避免潜在的 transpile 问题
  // 注意：始终 display:block（覆盖 CSS 规则中残留的 display:none），
  //       不依赖 display 显隐切换，因此 zoom/slide 动画的 transform 过渡能正常工作。
  //       overlay 的 opacity + pointerEvents 控制弹窗的可见与交互。
  //       不设 position 默认 static，让 overlay 的 flexbox 处理居中
  //       不设 top/left，让 CSS 规则的定位属性不影响 flexbox 布局
  // transform 始终 inline 设置，覆盖 CSS 规则中残留的 translate(-50%,-50%)（GrapesJS 画布定位）
  const contentStyle: React.CSSProperties = {
    display: 'block',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'static',
    width: modalWidth,
    transition: animStyle.transition || 'transform 0.25s ease, opacity 0.25s ease',
    opacity: animStyle.opacity !== undefined ? animStyle.opacity : 1,
    transform: animStyle.transform || 'none',
  };

  // 从 block HTML 的 inline style 中提取 WYSIWYG 视觉样式
  // 过滤掉：
  //   - display（防止编辑器写入的 'none' 残留）
  //   - overflow（由 Modal 控制）
  //   - position（由 overlay 的 flexbox 控制居中）
  // 并将连字符 key 转为 camelCase（确保 React 兼容）
  // 注：CSS 规则中的样式（border-radius、box-shadow、background 等）通过 id 匹配自动生效
  const rawStyle = (node.props.style || {}) as Record<string, string>;
  for (const [key, value] of Object.entries(rawStyle)) {
    if (key === 'display' || key === 'overflow' || key === 'position') continue;
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (camelKey === 'width') continue; // width 已由 modalWidth 控制
    (contentStyle as Record<string, unknown>)[camelKey] = value;
  }

  const modalContent = (
    <div
      className={`modal-overlay modal-${animation} ${visible ? 'modal-visible' : ''}`}
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        id={node.props.id as string}
        className="modal-content"
        style={contentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children || (
          <div style={{ padding: 24, textAlign: 'center', color: '#ccc' }}>
            弹窗内容为空
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default React.memo(Modal);

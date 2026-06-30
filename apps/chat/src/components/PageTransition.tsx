import React, { useRef, useMemo } from 'react';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './PageTransition.less';

const ANIMATION_MAP = {
  PUSH: 'forward',
  POP: 'back',
  REPLACE: 'back',
} as const;

/**
 * Route transition wrapper — inspired by spark-go's BaseLayout.
 *
 * 使用 TransitionGroup + CSSTransition 实现页面转场动画。
 * 必须作为布局路由（layout route）的 element 使用，通过 useOutlet() 获取子路由元素。
 *
 * Forward (PUSH):
 *   - 新页面从右侧滑入 (100% → 0)
 *   - 旧页面向左滑出带淡出 (0 → -20%, opacity: 1 → 0)
 *
 * Back (POP):
 *   - 当前页面向右滑出 (0 → 100%)
 *   - 前一页从左侧滑入带淡入 (-20% → 0, opacity: 0 → 1)
 */
const PageTransition: React.FC = () => {
  const location = useLocation();
  const navigateType = useNavigationType();
  const currentOutlet = useOutlet();

  // 为每个路径创建稳定 ref，避免 CSSTransition 动画冲突
  const nodeRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  const pathname = location.pathname;
  if (!nodeRefs.current[pathname]) {
    nodeRefs.current[pathname] = React.createRef<HTMLDivElement>();
  }
  const nodeRef = nodeRefs.current[pathname];

  const classNames = useMemo(
    () => ANIMATION_MAP[navigateType] ?? 'forward',
    [navigateType],
  );

  return (
    <TransitionGroup
      childFactory={(child) =>
        React.cloneElement(child, { classNames })
      }
    >
      <CSSTransition
        key={pathname}
        nodeRef={nodeRef}
        timeout={300}
        unmountOnExit
      >
        <div ref={nodeRef} className="route-transition-page">
          {currentOutlet}
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default PageTransition;

/**
 * 中间件系统类型定义与组合工具
 *
 * 中间件模式允许横向关注点（样式、事件、动画、埋点）通过链式处理，
 * 每个中间件可以读取/修改节点信息，或跳过渲染。
 */

import type { SchemaNode, Middleware } from '../types';

/**
 * 中间件链透传标记类型
 * 当中件间链没有中间件或中间件未处理时，返回此标记指示 renderer 执行默认渲染
 */
export interface MiddlewarePass {
  __middleware_pass: true;
  node: SchemaNode;
}

/**
 * 组合中间件链
 *
 * 从右到左组合中间件，使得它们按照传入顺序从左到右执行。
 * 每个中间件接收当前节点和一个 next 函数，调用 next 将控制权
 * 交给下一个中间件。
 *
 * 当提供 renderComponent 时，中间件链末端 identity 会调用 renderComponent
 * 产生实际 React 元素；前面中间件（eventHandler、styleInjector 等）通过
 * next() 拿到该元素后可以用 cloneElement 修改它。
 *
 * 不提供 renderComponent 时保持向后兼容：identity 返回透传标记，
 * 调用方自行处理渲染。
 *
 * @param node - 当前渲染的 SchemaNode
 * @param middlewares - 中间件数组
 * @param renderComponent - 可选，中间件链末端的组件渲染函数
 * @returns 最终渲染结果（ReactNode），中间件可返回 null 跳过渲染
 */
export function applyMiddlewares(
  node: SchemaNode,
  middlewares: Middleware[],
  renderComponent?: (node: SchemaNode) => React.ReactNode,
): React.ReactNode {
  // 终极 identity：有 renderComponent 时调用它产生真实元素；
  // 否则返回透传标记（向后兼容）
  const identity = renderComponent
    ? renderComponent
    : (n: SchemaNode): React.ReactNode => {
        return {
          __middleware_pass: true,
          node: n,
        } as unknown as React.ReactNode;
      };

  // 从右到左组合中间件（使第一个中间件最先执行）
  // 使用 for 循环避免 reduceRight 的类型推断问题
  let composed = identity;
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i];
    const next = composed;
    composed = (n: SchemaNode) => mw(n, next);
  }

  return composed(node);
}

/**
 * 检查中间件链结果是否为透传标记
 */
export function isMiddlewarePass(result: React.ReactNode): boolean {
  if (result === null || typeof result !== 'object') return false;
  const obj = result as unknown as Record<string, unknown>;
  return obj.__middleware_pass === true;
}

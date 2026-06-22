/**
 * UnknownComponent — 未知组件降级渲染
 *
 * 当渲染引擎遇到未注册的组件类型时，使用此组件进行降级渲染，
 * 确保页面不崩溃，同时显示调试信息。
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

/**
 * 未知组件降级组件
 *
 * 渲染内容：
 * - 开发提示：未知组件类型
 * - 子节点：正常递归渲染（保持树结构完整）
 */
const UnknownComponentInner: React.FC<BaseComponentProps> = ({ node, children }) => {
  return (
    <div
      id={node.props.id as string}
      data-schema-type={node.type}
      data-node-id={node.id}
      style={{
        padding: 16,
        border: '1px dashed #d9d9d9',
        borderRadius: 4,
        color: '#999',
        fontSize: 13,
        textAlign: 'center',
        minHeight: 40,
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#bbb',
          marginBottom: 8,
        }}
      >
        未知组件: {node.type}
        {(node.props?.style as React.CSSProperties | undefined) && (
          <span style={{ marginLeft: 8 }}>
            (含样式属性)
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export const UnknownComponent = React.memo(UnknownComponentInner);

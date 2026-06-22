/**
 * PageRenderer + ErrorBoundary 集成测试
 *
 * 覆盖：
 * - Loading 状态
 * - Error 状态
 * - Empty 状态（root 为 null/undefined）
 * - 正常渲染
 * - Unknown 组件降级
 * - hidden 节点跳过
 * - CSS 注入
 * - ErrorBoundary 错误捕获
 * - RendererProvider 集成
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RendererProvider, useRendererContext } from '../provider';
import { PageRenderer } from '../renderer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DefaultComponentRegistry, styleInjector } from '../index';
import type { PageSchema, SchemaNode, ComponentRenderer } from '../types';

/* ==================== 测试辅助组件 ==================== */

/** 简单的 Text 组件用于测试 */
const TestText: React.FC<{ node: SchemaNode; children?: React.ReactNode }> = ({
  node,
}) => {
  const content = (node.props.content as string) || '(空)';
  return React.createElement('span', { 'data-testid': 'text-component' }, content);
};

/** 简单的 Container 组件用于测试 */
const TestContainer: React.FC<{ node: SchemaNode; children?: React.ReactNode }> = ({
  children,
}) => {
  return React.createElement('div', { 'data-testid': 'container-component' }, children);
};

/** 基础的 extraComponents 注册表 */
const baseComponents: Record<string, ComponentRenderer> = {
  text: TestText as unknown as ComponentRenderer,
  container: TestContainer as unknown as ComponentRenderer,
};

/* ==================== PageRenderer ==================== */

describe('PageRenderer', () => {
  it('should show loading state', () => {
    const { container } = render(
      React.createElement(RendererProvider, {
        schema: { root: { id: '1', type: 'container', props: {} } },
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { loading: true }),
      }),
    );

    expect(container.textContent).toContain('页面加载中…');
  });

  it('should show error state', () => {
    const { container } = render(
      React.createElement(RendererProvider, {
        schema: { root: { id: '1', type: 'container', props: {} } },
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { error: '测试错误消息' }),
      }),
    );

    expect(container.textContent).toContain('测试错误消息');
  });

  it('should show empty state when no root', () => {
    const { container } = render(
      React.createElement(RendererProvider, {
        schema: { root: { id: '1', type: 'container', props: {} } },
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, {
          schema: null as unknown as PageSchema,
        }),
      }),
    );

    expect(container.textContent).toContain('页面暂无内容');
  });

  it('should render root component correctly', () => {
    const schema: PageSchema = {
      root: {
        id: '1',
        type: 'text',
        props: { content: 'Hello World' },
      },
    };

    render(
      React.createElement(RendererProvider, {
        schema,
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { schema }),
      }),
    );

    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('should render nested components', () => {
    const schema: PageSchema = {
      root: {
        id: '1',
        type: 'container',
        props: {},
        children: [
          {
            id: '2',
            type: 'text',
            props: { content: 'Nested Text' },
          },
        ],
      },
    };

    render(
      React.createElement(RendererProvider, {
        schema,
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { schema }),
      }),
    );

    expect(screen.getByText('Nested Text')).toBeDefined();
  });

  it('should skip hidden nodes', () => {
    const schema: PageSchema = {
      root: {
        id: '1',
        type: 'container',
        props: {},
        children: [
          { id: '2', type: 'text', props: { content: 'Visible' } },
          { id: '3', type: 'text', props: { content: 'Hidden' }, hidden: true },
        ],
      },
    };

    render(
      React.createElement(RendererProvider, {
        schema,
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { schema }),
      }),
    );

    expect(screen.getByText('Visible')).toBeDefined();
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('should show Unknown component for unregistered types', () => {
    const schema: PageSchema = {
      root: {
        id: '1',
        type: 'nonexistent-type',
        props: {},
      },
    };

    const { container } = render(
      React.createElement(RendererProvider, {
        schema,
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { schema }),
      }),
    );

    expect(container.textContent).toContain('未知组件');
    expect(container.textContent).toContain('nonexistent-type');
  });

  it('should inject global CSS', () => {
    const schema: PageSchema = {
      root: { id: '1', type: 'text', props: { content: 'test' } },
      css: 'body { color: red; }',
    };

    const { container } = render(
      React.createElement(RendererProvider, {
        schema,
        extraComponents: baseComponents,
        extraMiddlewares: [],
        children: React.createElement(PageRenderer, { schema }),
      }),
    );

    // Verify style element is rendered with the CSS content
    const styleElements = Array.from(container.querySelectorAll('style'));
    const cssStyle = styleElements.find(
      (el) => el.innerHTML.includes('body') && el.innerHTML.includes('red'),
    );
    expect(cssStyle).toBeDefined();
  });
});

/* ==================== ErrorBoundary ==================== */

describe('ErrorBoundary', () => {
  const ErrorComponent: React.FC = () => {
    throw new Error('测试错误');
  };

  it('should catch rendering errors and show fallback', () => {
    // Suppress console error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    const { container } = render(
      React.createElement(ErrorBoundary, {
        children: React.createElement(ErrorComponent),
      }),
    );

    expect(container.textContent).toContain('组件渲染异常');
    expect(container.textContent).toContain('测试错误');

    console.error = consoleError;
  });

  it('should render children normally when no error', () => {
    const { container } = render(
      React.createElement(ErrorBoundary, {
        children: React.createElement('div', null, '正常内容'),
      }),
    );

    expect(container.textContent).toContain('正常内容');
  });

  it('should support custom fallback', () => {
    const consoleError = console.error;
    console.error = vi.fn();

    const { container } = render(
      React.createElement(ErrorBoundary, {
        fallback: React.createElement('div', null, '自定义降级'),
        children: React.createElement(ErrorComponent),
      }),
    );

    expect(container.textContent).toContain('自定义降级');
    expect(container.textContent).not.toContain('组件渲染异常');

    console.error = consoleError;
  });

  it('should call onError callback', () => {
    const consoleError = console.error;
    console.error = vi.fn();
    const onError = vi.fn();

    render(
      React.createElement(ErrorBoundary, {
        onError,
        children: React.createElement(ErrorComponent),
      }),
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('测试错误');

    console.error = consoleError;
  });
});

/* ==================== RendererProvider ==================== */

describe('RendererProvider', () => {
  it('should provide context to children', () => {
    const ContextConsumer: React.FC = () => {
      const ctx = useRendererContext();
      expect(ctx.registry).toBeDefined();
      expect(ctx.middlewares).toBeDefined();
      return React.createElement('div', null, 'context works');
    };

    const { container } = render(
      React.createElement(RendererProvider, {
        schema: { root: { id: '1', type: 'text', props: {} } },
        extraComponents: baseComponents,
        extraMiddlewares: [styleInjector],
        children: React.createElement(ContextConsumer),
      }),
    );

    expect(container.textContent).toContain('context works');
  });

  it('should throw when used outside provider', () => {
    const BadComponent: React.FC = () => {
      useRendererContext();
      return null;
    };

    expect(() => {
      render(React.createElement(BadComponent));
    }).toThrow('useRendererContext');
  });
});

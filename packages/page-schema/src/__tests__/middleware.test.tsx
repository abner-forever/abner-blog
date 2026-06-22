/**
 * 中间件系统集成测试
 *
 * 覆盖：
 * - applyMiddlewares / isMiddlewarePass
 * - styleInjector
 * - eventHandler
 * - animationInjector
 * - createConditionMiddleware
 * - createVariableParserMiddleware
 * - createAnalyticsMiddleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import type { SchemaNode, Middleware } from '../types';
import { applyMiddlewares, isMiddlewarePass } from '../middleware/types';
import { styleInjector } from '../middleware/style-injector';
import { createEventHandler } from '../middleware/event-handler';
import { registerBuiltInActions } from '../event-engine/built-in-actions';
import { animationInjector } from '../middleware/animation';
import { createConditionMiddleware } from '../middleware/condition';
import { createVariableParserMiddleware } from '../middleware/variable-parser';
import { createAnalyticsMiddleware } from '../middleware/analytics';

/* ==================== applyMiddlewares / isMiddlewarePass ==================== */

describe('applyMiddlewares', () => {
  it('should pass through with empty middleware list', () => {
    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const result = applyMiddlewares(node, []);
    expect(isMiddlewarePass(result)).toBe(true);
  });

  it('should execute middlewares in order', () => {
    const order: number[] = [];
    const mw1: Middleware = (n, next) => { order.push(1); return next(n); };
    const mw2: Middleware = (n, next) => { order.push(2); return next(n); };
    const mw3: Middleware = (n, next) => { order.push(3); return next(n); };

    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    applyMiddlewares(node, [mw1, mw2, mw3]);

    // mw1 should execute first, then mw2, then mw3
    expect(order).toEqual([1, 2, 3]);
  });

  it('should allow middleware to skip rendering by returning null', () => {
    const skipMw: Middleware = () => null;
    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const result = applyMiddlewares(node, [skipMw]);
    expect(result).toBeNull();
  });
});

describe('isMiddlewarePass', () => {
  it('should return true for pass markers', () => {
    const result = { __middleware_pass: true, node: { id: '1', type: 'text', props: {} } };
    expect(isMiddlewarePass(result as unknown as React.ReactNode)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isMiddlewarePass(null)).toBe(false);
  });

  it('should return false for React elements', () => {
    expect(isMiddlewarePass(React.createElement('div'))).toBe(false);
  });
});

/* ==================== styleInjector ==================== */

describe('styleInjector', () => {
  it('should inject style into rendered element', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { style: { color: 'red', fontSize: 16 } },
    };

    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'hello');
    const result = styleInjector(node, next);

    expect(React.isValidElement(result)).toBe(true);
    const rendered = result as React.ReactElement;
    expect(rendered.props.style).toEqual({ color: 'red', fontSize: 16 });
  });

  it('should pass through when no style set', () => {
    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'hello');
    const result = styleInjector(node, next);
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should return null when next returns null', () => {
    const node: SchemaNode = { id: '1', type: 'text', props: { style: { color: 'red' } } };
    const next = () => null;
    expect(styleInjector(node, next)).toBeNull();
  });
});

/* ==================== createEventHandler ==================== */

/** 创建一个 mock ActionContext */
function createMockContext() {
  return {
    sourceNode: {} as SchemaNode,
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    modals: { open: vi.fn(), close: vi.fn() },
    navigate: vi.fn(),
    variables: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), clear: vi.fn() },
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(() => vi.fn()),
    },
    getRootNode: vi.fn(() => ({ id: 'root', type: 'container', props: {} })),
  };
}

describe('createEventHandler', () => {
  beforeEach(() => {
    registerBuiltInActions();
  });
  it('should inject onClick from node.events', () => {
    const context = createMockContext();
    const mw = createEventHandler(context);

    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: {},
      events: [
        {
          event: 'click',
          actions: [{ id: 'a1', type: 'toast', config: { type: 'success', message: 'hi' } }],
        },
      ],
    };

    const next = (n: SchemaNode) => React.createElement('button', { key: n.id }, 'click me');
    const result = mw(node, next) as React.ReactElement;

    expect(result.props.onClick).toBeDefined();

    result.props.onClick({ preventDefault: vi.fn() } as unknown as React.MouseEvent);
    expect(context.toast.success).toHaveBeenCalledWith('hi');
  });

  it('should inject multiple event types', () => {
    const context = createMockContext();
    const mw = createEventHandler(context);

    const node: SchemaNode = {
      id: '1',
      type: 'input',
      props: {},
      events: [
        {
          event: 'click',
          actions: [{ id: 'a1', type: 'toast', config: { type: 'info', message: 'clicked' } }],
        },
        {
          event: 'mouseEnter',
          actions: [{ id: 'a2', type: 'toast', config: { type: 'info', message: 'hovered' } }],
        },
      ],
    };

    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'element');
    const result = mw(node, next) as React.ReactElement;

    expect(result.props.onClick).toBeDefined();
    expect(result.props.onMouseEnter).toBeDefined();
  });

  it('should pass through with no events', () => {
    const context = createMockContext();
    const mw = createEventHandler(context);

    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'text');
    const result = mw(node, next);

    expect(React.isValidElement(result)).toBe(true);
  });

  it('should return null when next returns null', () => {
    const context = createMockContext();
    const mw = createEventHandler(context);

    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const next = () => null;
    expect(mw(node, next)).toBeNull();
  });
});

/* ==================== animationInjector ==================== */

describe('animationInjector', () => {
  it('should inject animation style when configured', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { animation: { type: 'fadeIn', duration: 500 } },
    };

    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'animated');
    const result = animationInjector(node, next) as React.ReactElement;

    expect(result.props.style).toBeDefined();
    expect(result.props.style.animation).toContain('mw-fadeIn');
    expect(result.props.style.animation).toContain('500ms');
  });

  it('should pass through when no animation configured', () => {
    const node: SchemaNode = { id: '1', type: 'text', props: {} };
    const next = (n: SchemaNode) => React.createElement('div', { key: n.id }, 'text');
    const result = animationInjector(node, next);
    expect(React.isValidElement(result)).toBe(true);
  });
});

/* ==================== createConditionMiddleware ==================== */

describe('createConditionMiddleware', () => {
  it('should render when condition is met', () => {
    const mw = createConditionMiddleware({ userRole: 'admin' });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { condition: { field: 'userRole', operator: 'eq' as const, value: 'admin' } },
    };

    const next = vi.fn((n: SchemaNode) => React.createElement('div', null, 'content'));
    const result = mw(node, next);

    expect(next).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it('should skip rendering when condition is not met', () => {
    const mw = createConditionMiddleware({ userRole: 'guest' });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { condition: { field: 'userRole', operator: 'eq' as const, value: 'admin' } },
    };

    const next = vi.fn();
    const result = mw(node, next);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should skip rendering when show is false', () => {
    const mw = createConditionMiddleware({});
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { show: false },
    };

    const next = vi.fn();
    const result = mw(node, next);
    expect(result).toBeNull();
  });

  it('should render when show is true', () => {
    const mw = createConditionMiddleware({});
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { show: true },
    };

    const next = vi.fn((n: SchemaNode) => React.createElement('div', null, 'content'));
    const result = mw(node, next);
    expect(next).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it('should support gt operator', () => {
    const mw = createConditionMiddleware({ count: 10 });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { condition: { field: 'count', operator: 'gt' as const, value: 5 } },
    };

    const next = vi.fn((n: SchemaNode) => React.createElement('div'));
    expect(mw(node, next)).not.toBeNull();
  });

  it('should support contains operator', () => {
    const mw = createConditionMiddleware({ name: 'hello world' });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { condition: { field: 'name', operator: 'contains' as const, value: 'world' } },
    };

    const next = vi.fn((n: SchemaNode) => React.createElement('div'));
    expect(mw(node, next)).not.toBeNull();
  });
});

/* ==================== createVariableParserMiddleware ==================== */

describe('createVariableParserMiddleware', () => {
  it('should replace variables in string props', () => {
    const mw = createVariableParserMiddleware({ username: '张三', count: 42 });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: '欢迎，{{username}}！你有{{count}}条消息。' },
    };

    let resolvedNode: SchemaNode | null = null;
    const next = (n: SchemaNode) => {
      resolvedNode = n;
      return React.createElement('div');
    };

    mw(node, next);
    expect(resolvedNode?.props.content).toBe('欢迎，张三！你有42条消息。');
  });

  it('should preserve unresolved variables', () => {
    const mw = createVariableParserMiddleware({});
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: '{{unknownVar}}' },
    };

    let resolvedNode: SchemaNode | null = null;
    const next = (n: SchemaNode) => {
      resolvedNode = n;
      return React.createElement('div');
    };

    mw(node, next);
    expect(resolvedNode?.props.content).toBe('{{unknownVar}}');
  });

  it('should pass through when no variables match', () => {
    const mw = createVariableParserMiddleware({ name: 'test' });
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: 'no variables here' },
    };

    let resolvedNode: SchemaNode | null = null;
    const next = (n: SchemaNode) => {
      resolvedNode = n;
    };

    mw(node, next);
    expect(resolvedNode?.props.content).toBe('no variables here');
  });

  it('should handle empty variables map', () => {
    const mw = createVariableParserMiddleware({});
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: '{{name}}' },
    };

    const next = vi.fn();
    mw(node, next);
    expect(next).toHaveBeenCalled();
  });
});

/* ==================== createAnalyticsMiddleware ==================== */

describe('createAnalyticsMiddleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should call tracker on click', () => {
    const tracker = vi.fn();
    const mw = createAnalyticsMiddleware(tracker);
    const node: SchemaNode = {
      id: 'test-id',
      type: 'button',
      props: { analytics: { category: 'test', action: 'click' } },
    };

    const next = (n: SchemaNode) => React.createElement('button', { key: n.id }, 'click');
    const result = mw(node, next) as React.ReactElement;

    // Simulate click
    result.props.onClick({ preventDefault: vi.fn() } as unknown as React.MouseEvent);

    expect(tracker).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'test',
        action: 'click',
        nodeType: 'button',
        nodeId: 'test-id',
      }),
    );
  });

  it('should pass through when no analytics prop', () => {
    const tracker = vi.fn();
    const mw = createAnalyticsMiddleware(tracker);
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: {},
    };

    const next = (n: SchemaNode) => React.createElement('div');
    const result = mw(node, next);
    expect(React.isValidElement(result)).toBe(true);
  });
});

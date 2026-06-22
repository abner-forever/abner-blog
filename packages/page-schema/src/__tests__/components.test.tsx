/**
 * 核心组件渲染测试
 *
 * 覆盖 10 个关键组件的基本渲染行为：
 * - Container / Section / Row / Column（布局）
 * - Text（内容）
 * - Image（内容，含空状态）
 * - Button（内容，含 variant 样式）
 * - Divider / Spacer（装饰）
 *
 * v1.4 表单/数据组件不在此处测试（依赖 FormContext / API）
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { BaseComponentProps, SchemaNode } from '../types';
import Container from '../components/Container';
import Section from '../components/Section';
import Row from '../components/Row';
import Column from '../components/Column';
import Text from '../components/Text';
import Image from '../components/Image';
import Button from '../components/Button';
import Divider from '../components/Divider';
import Spacer from '../components/Spacer';

/* ==================== Container ==================== */

describe('Container', () => {
  it('should render as div with children', () => {
    const node: SchemaNode = { id: '1', type: 'container', props: {} };
    const { container } = render(
      React.createElement(Container as React.FC<BaseComponentProps>, {
        node,
        children: React.createElement('span', null, 'child'),
      }),
    );
    const div = container.querySelector('div');
    expect(div).toBeDefined();
    expect(div?.textContent).toBe('child');
  });

  it('should apply style from props', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'container',
      props: { style: { backgroundColor: 'red' } },
    };
    const { container } = render(
      React.createElement(Container as React.FC<BaseComponentProps>, { node }),
    );
    const div = container.querySelector('div');
    expect(div?.style.backgroundColor).toBe('red');
  });
});

/* ==================== Section ==================== */

describe('Section', () => {
  it('should render as section element', () => {
    const node: SchemaNode = { id: '1', type: 'section', props: {} };
    const { container } = render(
      React.createElement(Section as React.FC<BaseComponentProps>, { node }),
    );
    expect(container.querySelector('section')).toBeDefined();
  });

  it('should have default minHeight', () => {
    const node: SchemaNode = { id: '1', type: 'section', props: {} };
    const { container } = render(
      React.createElement(Section as React.FC<BaseComponentProps>, { node }),
    );
    const section = container.querySelector('section');
    expect(section?.style.minHeight).toBe('100px');
  });
});

/* ==================== Row / Column ==================== */

describe('Row', () => {
  it('should render as flex container', () => {
    const node: SchemaNode = { id: '1', type: 'row', props: {} };
    const { container } = render(
      React.createElement(Row as React.FC<BaseComponentProps>, { node }),
    );
    const div = container.querySelector('div');
    expect(div?.style.display).toBe('flex');
  });
});

describe('Column', () => {
  it('should render with flex: 1', () => {
    const node: SchemaNode = { id: '1', type: 'column', props: {} };
    const { container } = render(
      React.createElement(Column as React.FC<BaseComponentProps>, { node }),
    );
    const div = container.querySelector('div');
    expect(div?.style.flexGrow).toBe('1');
  });
});

/* ==================== Text ==================== */

describe('Text', () => {
  it('should render content as p by default', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: 'Hello World' },
    };
    const { container } = render(
      React.createElement(Text as React.FC<BaseComponentProps>, { node }),
    );
    const p = container.querySelector('p');
    expect(p).toBeDefined();
    expect(p?.textContent).toBe('Hello World');
  });

  it('should render as h1 when as=h1', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: { content: 'Heading', as: 'h1' },
    };
    const { container } = render(
      React.createElement(Text as React.FC<BaseComponentProps>, { node }),
    );
    expect(container.querySelector('h1')).toBeDefined();
    expect(container.querySelector('h1')?.textContent).toBe('Heading');
  });

  it('should show placeholder when content is empty', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'text',
      props: {},
    };
    const { container } = render(
      React.createElement(Text as React.FC<BaseComponentProps>, { node }),
    );
    const p = container.querySelector('p');
    expect(p?.textContent).toBe('(空文本)');
  });
});

/* ==================== Image ==================== */

describe('Image', () => {
  it('should render img with src', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'image',
      props: { src: 'https://example.com/img.jpg', alt: 'test' },
    };
    const { container } = render(
      React.createElement(Image as React.FC<BaseComponentProps>, { node }),
    );
    const img = container.querySelector('img');
    expect(img).toBeDefined();
    expect(img?.src).toContain('example.com/img.jpg');
    expect(img?.alt).toBe('test');
  });

  it('should show placeholder when src is empty', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'image',
      props: {},
    };
    const { container } = render(
      React.createElement(Image as React.FC<BaseComponentProps>, { node }),
    );
    expect(container.textContent).toContain('图片占位');
  });

  it('should support lazy loading', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'image',
      props: { src: 'https://example.com/img.jpg', lazy: true },
    };
    const { container } = render(
      React.createElement(Image as React.FC<BaseComponentProps>, { node }),
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });
});

/* ==================== Button ==================== */

describe('Button', () => {
  it('should render button with text', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: { text: '点击' },
    };
    const { container } = render(
      React.createElement(Button as React.FC<BaseComponentProps>, { node }),
    );
    const btn = container.querySelector('button');
    expect(btn).toBeDefined();
    expect(btn?.textContent).toContain('点击');
  });

  it('should render as button with link variant style', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: { text: '链接', variant: 'link' },
    };
    const { container } = render(
      React.createElement(Button as React.FC<BaseComponentProps>, { node }),
    );
    const btn = container.querySelector('button');
    expect(btn).toBeDefined();
    expect(btn?.style.textDecoration).toBe('underline');
    // 事件绑定通过 node.events 处理，不再通过 props.href
  });

  it('should apply primary variant style', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: { text: '主要', variant: 'primary' },
    };
    const { container } = render(
      React.createElement(Button as React.FC<BaseComponentProps>, { node }),
    );
    const btn = container.querySelector('button');
    expect(btn?.style.background).toBe('rgb(24, 144, 255)');
    expect(btn?.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should apply default variant style', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: { text: '默认', variant: 'default' },
    };
    const { container } = render(
      React.createElement(Button as React.FC<BaseComponentProps>, { node }),
    );
    const btn = container.querySelector('button');
    expect(btn?.style.background).toBe('rgb(255, 255, 255)');
    expect(btn?.style.color).toBe('rgb(51, 51, 51)');
    expect(btn?.style.border).toContain('rgb(217, 217, 217)');
  });

  it('should show loading state', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'button',
      props: { text: '加载', loading: true },
    };
    const { container } = render(
      React.createElement(Button as React.FC<BaseComponentProps>, { node }),
    );
    const btn = container.querySelector('button');
    expect(btn?.disabled).toBe(true);
  });
});

/* ==================== Divider ==================== */

describe('Divider', () => {
  it('should render as hr by default', () => {
    const node: SchemaNode = { id: '1', type: 'divider', props: {} };
    const { container } = render(
      React.createElement(Divider as React.FC<BaseComponentProps>, { node }),
    );
    expect(container.querySelector('hr')).toBeDefined();
  });

  it('should apply custom color', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'divider',
      props: { color: '#ff0000' },
    };
    const { container } = render(
      React.createElement(Divider as React.FC<BaseComponentProps>, { node }),
    );
    const hr = container.querySelector('hr');
    expect(hr?.style.borderTopWidth).toBe('1px');
    expect(hr?.style.borderTopStyle).toBe('solid');
    expect(hr?.style.borderTopColor).toBe('rgb(255, 0, 0)');
  });
});

/* ==================== Spacer ==================== */

describe('Spacer', () => {
  it('should render with default height', () => {
    const node: SchemaNode = { id: '1', type: 'spacer', props: {} };
    const { container } = render(
      React.createElement(Spacer as React.FC<BaseComponentProps>, { node }),
    );
    const div = container.querySelector('div');
    expect(div?.style.height).toBe('40px');
  });

  it('should respect custom height', () => {
    const node: SchemaNode = {
      id: '1',
      type: 'spacer',
      props: { height: 100 },
    };
    const { container } = render(
      React.createElement(Spacer as React.FC<BaseComponentProps>, { node }),
    );
    const div = container.querySelector('div');
    expect(div?.style.height).toBe('100px');
  });
});

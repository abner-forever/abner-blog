import { describe, it, expect } from 'vitest';
import {
  ComponentTypeConst,
  ComponentType,
  DefaultComponentRegistry,
  generateNodeId,
  createDefaultNode,
} from '../types';
import type { SchemaNode, PageSchema, ComponentRegistry } from '../types';

describe('ComponentTypeConst', () => {
  it('should define core component types', () => {
    expect(ComponentTypeConst.CONTAINER).toBe('container');
    expect(ComponentTypeConst.SECTION).toBe('section');
    expect(ComponentTypeConst.TEXT).toBe('text');
    expect(ComponentTypeConst.IMAGE).toBe('image');
    expect(ComponentTypeConst.BUTTON).toBe('button');
    expect(ComponentTypeConst.VIDEO).toBe('video');
  });

  it('should define extended component types', () => {
    expect(ComponentTypeConst.CARD).toBe('card');
    expect(ComponentTypeConst.ACCORDION).toBe('accordion');
    expect(ComponentTypeConst.TABS).toBe('tabs');
    expect(ComponentTypeConst.CAROUSEL).toBe('carousel');
    expect(ComponentTypeConst.MAP).toBe('map');
    expect(ComponentTypeConst.NAV_MENU).toBe('nav-menu');
    expect(ComponentTypeConst.NAV_LINK).toBe('nav-link');
    expect(ComponentTypeConst.HTML_EMBED).toBe('html-embed');
  });

  it('should define layout component types', () => {
    expect(ComponentTypeConst.ROW).toBe('row');
    expect(ComponentTypeConst.COLUMN).toBe('column');
    expect(ComponentTypeConst.DIVIDER).toBe('divider');
    expect(ComponentTypeConst.SPACER).toBe('spacer');
  });
});

describe('ComponentType enum', () => {
  it('should contain core types', () => {
    expect(ComponentType.CONTAINER).toBe('container');
    expect(ComponentType.TEXT).toBe('text');
  });
});

describe('DefaultComponentRegistry', () => {
  it('should register and retrieve components', () => {
    const registry: ComponentRegistry = new DefaultComponentRegistry();
    const mockComp = () => null;

    registry.register('test-type', mockComp);
    expect(registry.get('test-type')).toBe(mockComp);
  });

  it('should return undefined for unregistered types', () => {
    const registry: ComponentRegistry = new DefaultComponentRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('should support constructor injection', () => {
    const compA = () => null;
    const compB = () => null;
    const registry: ComponentRegistry = new DefaultComponentRegistry({
      typeA: compA,
      typeB: compB,
    });

    expect(registry.get('typeA')).toBe(compA);
    expect(registry.get('typeB')).toBe(compB);
  });

  it('should override existing registration', () => {
    const registry: ComponentRegistry = new DefaultComponentRegistry();
    const compA = () => null;
    const compB = () => null;

    registry.register('test', compA);
    registry.register('test', compB);
    expect(registry.get('test')).toBe(compB);
  });
});

describe('generateNodeId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateNodeId();
    const id2 = generateNodeId();
    expect(id1).not.toBe(id2);
  });

  it('should start with node_ prefix', () => {
    const id = generateNodeId();
    expect(id.startsWith('node_')).toBe(true);
  });
});

describe('createDefaultNode', () => {
  it('should create a node with default props', () => {
    const node = createDefaultNode('container');
    expect(node.type).toBe('container');
    expect(node.props).toEqual({});
    expect(node.children).toEqual([]);
    expect(node.id).toBeTruthy();
  });

  it('should merge overrides', () => {
    const node = createDefaultNode('text', { hidden: true });
    expect(node.type).toBe('text');
    expect(node.hidden).toBe(true);
  });
});

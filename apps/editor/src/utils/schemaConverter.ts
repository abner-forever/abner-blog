import type { Editor, Component } from 'grapesjs';
import type { PageSchema, SchemaNode, EventBinding } from '@abner-blog/page-schema';
import { ComponentType } from '@abner-blog/page-schema';

/**
 * GrapesJS 组件 → 页面 Schema 转换器（v2）
 *
 * 改造说明：
 * - v1 按 HTML 标签 + GrapesJS 类型映射
 * - v2 优先读取 data-schema-type，支持 28 种组件类型
 *
 * 数据流：
 * 编辑器拖拽组件 → GrapesJS 组件树
 *   → schemaConverter
 *   → SchemaNode 树（Node-based）
 *   → 服务器存储 / 编辑器预览 / C端渲染
 */

/* ==================== 类型定义 ==================== */

/** 每种组件类型的 props 提取器 */
interface TypeExtractor {
  extractProps: (el: HTMLElement, comp: Component) => Record<string, unknown>;
}

/** 类型映射表条目 */
interface TypeMapping {
  schemaType: string;
  extractProps: (el: HTMLElement, comp: Component) => Record<string, unknown>;
}

/* ==================== 基础提取器 ==================== */

/** 提取通用属性（style + className + id + data-* 属性） */
function extractCommonProps(el: HTMLElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  const style = el.getAttribute('style');
  if (style) {
    props.style = parseInlineStyle(style);
  }

  const className = el.getAttribute('class');
  if (className) {
    props.className = className;
  }

  // 捕获元素 id，用于匹配 GrapesJS CSS Composer 中的 #id 选择器样式
  if (el.id) {
    props.id = el.id;
  }

  return props;
}

/** 提取文本内容（纯文本，去除 HTML 标签） */
function extractTextContent(el: HTMLElement): string {
  return el.textContent || el.innerText || '';
}

/** 提取 HTML 属性值 */
function getAttr(el: HTMLElement, name: string): string | undefined {
  return el.getAttribute(name) || undefined;
}

/* ==================== 组件特定提取器 ==================== */

/** Text：提取 content 和 as */
function extractTextProps(el: HTMLElement): Record<string, unknown> {
  const tag = el.tagName.toUpperCase();
  const content = extractTextContent(el);

  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) {
    return { as: `h${tag.slice(1)}`, content };
  }

  const as = tag === 'SPAN' ? 'span' : tag === 'LABEL' ? 'span' : 'p';
  return { as, content };
}

/** Image：提取 src、alt、lazy */
function extractImageProps(el: HTMLElement): Record<string, unknown> {
  const img = el as HTMLImageElement;
  return {
    src: img.src || getAttr(el, 'src') || '',
    alt: img.alt || getAttr(el, 'alt') || '',
    lazy: el.hasAttribute('loading'),
    width: img.width || undefined,
    height: img.height || undefined,
  };
}

/** Button：提取 text、variant */
function extractButtonProps(el: HTMLElement, comp: Component): Record<string, unknown> {
  const text = extractTextContent(el);

  // 从样式中推断 variant
  const style = el.getAttribute('style') || '';
  let variant = 'primary';
  if (style.includes('background:transparent') || style.includes('background: transparent')) {
    variant = style.includes('text-decoration:underline') ? 'link' : 'text';
  } else if (style.includes('border:1px solid #d9d9d9') || style.includes('background:#fff')) {
    variant = 'default';
  }

  return { text, variant };
}

/** Video：提取 src、poster、controls、autoplay、loop */
function extractVideoProps(el: HTMLElement): Record<string, unknown> {
  if (el.tagName === 'IFRAME') {
    const iframe = el as HTMLIFrameElement;
    return { src: iframe.src || '', controls: true };
  }

  const video = el as HTMLVideoElement;
  return {
    src: video.src || '',
    poster: video.poster || getAttr(el, 'poster') || '',
    controls: video.controls || true,
    autoplay: video.autoplay || false,
    loop: video.loop || false,
    muted: video.muted || false,
  };
}

/** Divider：提取 color、height、style */
function extractDividerProps(el: HTMLElement): Record<string, unknown> {
  const style = el.getAttribute('style') || '';
  // 解析 border-top 或 border-bottom
  let color = '#e8e8e8';
  let height = 1;
  let lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid';

  const borderMatch = style.match(/border-top:\s*(\d+)px\s+(\w+)\s+(#[0-9a-fA-F]+|[a-zA-Z]+)/);
  if (borderMatch) {
    height = parseInt(borderMatch[1], 10) || 1;
    lineStyle = borderMatch[2] as 'solid' | 'dashed' | 'dotted';
    color = borderMatch[3];
  }

  return { color, height, style: lineStyle };
}

/** Spacer：提取 height */
function extractSpacerProps(el: HTMLElement): Record<string, unknown> {
  const style = el.getAttribute('style') || '';
  const heightMatch = style.match(/height:\s*(\d+)px/);
  return { height: heightMatch ? parseInt(heightMatch[1], 10) : 40 };
}

/** BilibiliVideo：提取 bvid */
function extractBilibiliProps(el: HTMLElement): Record<string, unknown> {
  const src = el.getAttribute('src') || '';
  const bvidMatch = src.match(/bvid=([^&]+)/);
  const pageMatch = src.match(/page=(\d+)/);
  return {
    bvid: bvidMatch ? bvidMatch[1] : '',
    page: pageMatch ? parseInt(pageMatch[1], 10) : 1,
  };
}

/** TencentVideo：提取 vid */
function extractTencentProps(el: HTMLElement): Record<string, unknown> {
  const src = el.getAttribute('src') || '';
  const vidMatch = src.match(/vid=([^&]+)/);
  return { vid: vidMatch ? vidMatch[1] : '' };
}

/** Card：提取 imageSrc、title、description、href */
function extractCardProps(el: HTMLElement): Record<string, unknown> {
  const img = el.querySelector('img');
  const h3 = el.querySelector('h3');
  const p = el.querySelector('p');
  const link = el.closest('a') || el.querySelector('a');

  return {
    imageSrc: img?.src || getAttr(img as HTMLElement, 'src') || '',
    imageAlt: img?.alt || '',
    title: h3?.textContent || '',
    description: p?.textContent || '',
    href: link?.getAttribute('href') || undefined,
  };
}

/** Accordion：提取 items */
function extractAccordionProps(el: HTMLElement): Record<string, unknown> {
  const detailsList = el.querySelectorAll('details');
  const items: Array<{ title: string; defaultOpen?: boolean }> = [];

  detailsList.forEach((details) => {
    const summary = details.querySelector('summary');
    items.push({
      title: summary?.textContent || '未命名',
      defaultOpen: details.hasAttribute('open'),
    });
  });

  return { items: items.length > 0 ? items : undefined };
}

/** Tabs：提取 tabLabels 和 activeIndex */
function extractTabsProps(el: HTMLElement): Record<string, unknown> {
  const tabButtons = el.querySelectorAll('[data-tab]');
  const tabLabels: string[] = [];

  tabButtons.forEach((btn) => {
    tabLabels.push(btn.textContent || `标签${tabLabels.length + 1}`);
  });

  let activeIndex = 0;
  tabButtons.forEach((btn, i) => {
    const btnEl = btn as HTMLElement;
    const style = btnEl.getAttribute('style') || '';
    if (style.includes('border-bottom:2px solid #1890ff') || style.includes('background:#fff')) {
      activeIndex = i;
    }
  });

  return { tabLabels: tabLabels.length > 0 ? tabLabels : undefined, activeIndex };
}

/** Carousel：提取 slides、interval、autoplay */
function extractCarouselProps(el: HTMLElement): Record<string, unknown> {
  const inner = el.querySelector('[data-carousel-inner]');
  const slides: string[] = [];

  if (inner) {
    const images = inner.querySelectorAll('img');
    images.forEach((img) => {
      slides.push(img.src);
    });
  }

  return {
    slides: slides.length > 0 ? slides : undefined,
    interval: 3000,
    autoplay: true,
    indicators: true,
  };
}

/** Map：提取 src、address */
function extractMapProps(el: HTMLElement): Record<string, unknown> {
  const iframe = el.querySelector('iframe');
  return {
    src: iframe?.src || '',
    width: '100%',
    height: '300px',
  };
}

/** NavMenu：提取 sticky、items */
function extractNavMenuProps(el: HTMLElement): Record<string, unknown> {
  const links = el.querySelectorAll('a');
  const items: Array<{ label: string; href: string; target?: '_blank' | '_self' }> = [];

  links.forEach((link) => {
    items.push({
      label: link.textContent || '链接',
      href: link.getAttribute('href') || '#',
      target: link.getAttribute('target') as '_blank' | '_self' | undefined,
    });
  });

  return {
    sticky: true,
    items: items.length > 0 ? items : undefined,
  };
}

/** NavLink：提取 text、href、target */
function extractNavLinkProps(el: HTMLElement): Record<string, unknown> {
  return {
    text: extractTextContent(el),
    href: getAttr(el, 'href') || '#',
    target: getAttr(el, 'target') || '_self',
  };
}

/** HtmlEmbed：提取 html */
function extractHtmlEmbedProps(el: HTMLElement): Record<string, unknown> {
  return { html: el.innerHTML || '' };
}

/** Form：提取 action、method、api */
function extractFormProps(el: HTMLElement): Record<string, unknown> {
  return {
    action: getAttr(el, 'action') || undefined,
    method: (getAttr(el, 'method') || 'POST') as 'GET' | 'POST',
    // 如果有 data-page-form 属性则为 API 模式
    api: el.hasAttribute('data-page-form') ? '/api/page-form/submit' : undefined,
  };
}

/** FormInput：提取 label、name、placeholder、required、type */
function extractFormInputProps(el: HTMLElement): Record<string, unknown> {
  const input = el.querySelector('input') || el;
  const label = el.querySelector('label');

  return {
    label: label?.textContent?.replace(/[\s:]*$/, '') || '',
    name: (input as HTMLInputElement).name || getAttr(input as HTMLElement, 'name') || '',
    placeholder: getAttr(input as HTMLElement, 'placeholder') || '',
    required: (input as HTMLInputElement).required || el.querySelector('[required]') !== null,
    type: getAttr(input as HTMLElement, 'type') || 'text',
  };
}

/** FormTextarea：提取 label、name、placeholder、required、rows */
function extractFormTextareaProps(el: HTMLElement): Record<string, unknown> {
  const textarea = el.querySelector('textarea') || el;
  const label = el.querySelector('label');

  return {
    label: label?.textContent?.replace(/[\s:]*$/, '') || '',
    name: (textarea as HTMLTextAreaElement).name || getAttr(textarea as HTMLElement, 'name') || '',
    placeholder: getAttr(textarea as HTMLElement, 'placeholder') || '',
    required: (textarea as HTMLTextAreaElement).required || el.querySelector('[required]') !== null,
    rows: parseInt(getAttr(textarea as HTMLElement, 'rows') || '4', 10),
  };
}

/** FormSelect：提取 label、name、options、required */
function extractFormSelectProps(el: HTMLElement): Record<string, unknown> {
  const select = el.querySelector('select') || el;
  const label = el.querySelector('label');
  const options: Array<{ label: string; value: string }> = [];

  const selectEl = select as HTMLSelectElement;
  if (selectEl.options) {
    Array.from(selectEl.options).forEach((opt) => {
      if (opt.value) {
        options.push({ label: opt.text, value: opt.value });
      }
    });
  }

  return {
    label: label?.textContent?.replace(/[\s:]*$/, '') || '',
    name: selectEl.name || getAttr(select as HTMLElement, 'name') || '',
    options: options.length > 0 ? options : undefined,
    required: selectEl.required || el.querySelector('[required]') !== null,
  };
}

/** FormCheckbox：提取 label、name、required */
function extractFormCheckboxProps(el: HTMLElement): Record<string, unknown> {
  const input = el.querySelector('input') || el;
  const label = el.querySelector('label');

  // 获取 label 文本（去掉 input 元素的文本）
  let labelText = '';
  if (label) {
    labelText = label.textContent || '';
    // 去除 checkbox 触发的文本
    labelText = labelText.replace(/^\s*/, '').replace(/\s*$/, '');
  }

  return {
    label: labelText || '',
    name: (input as HTMLInputElement).name || getAttr(input as HTMLElement, 'name') || '',
    required: (input as HTMLInputElement).required || el.querySelector('[required]') !== null,
  };
}

/** FormSubmit：提取 text */
function extractFormSubmitProps(el: HTMLElement): Record<string, unknown> {
  return { text: extractTextContent(el) || '提交' };
}

/** DataList：提取 items、api、pageSize */
function extractDataListProps(el: HTMLElement): Record<string, unknown> {
  // 从模板结构中提取静态数据
  const items: Array<Record<string, unknown>> = [];
  const itemElements = el.querySelectorAll('[data-datalist] > div > div');

  itemElements.forEach((itemEl) => {
    const title = itemEl.querySelector('div:first-child')?.textContent || '';
    const desc = itemEl.querySelector('div:last-child')?.textContent || '';
    if (title) {
      items.push({ title, description: desc });
    }
  });

  return {
    items: items.length > 0 ? items : undefined,
    pageSize: 10,
  };
}

/** DataBadge：提取 count、text */
function extractDataBadgeProps(el: HTMLElement): Record<string, unknown> {
  const spans = el.querySelectorAll('span');
  let text = '';
  let count: number | undefined;

  spans.forEach((span, i) => {
    if (i === 0) text = span.textContent || '';
    if (i === 1) {
      const countText = span.textContent || '0';
      count = parseInt(countText.replace(/[,\s]/g, ''), 10) || 0;
    }
  });

  // 如果解析不到，从整体文本提取
  if (!text) text = el.textContent || '';
  if (count === undefined) {
    const numMatch = el.textContent?.match(/(\d[\d,]*)/);
    count = numMatch ? parseInt(numMatch[1].replace(/,/g, ''), 10) : 0;
  }

  return { text, count, maxCount: 999 };
}

/* ==================== 类型映射表 ==================== */

/**
 * data-schema-type → 类型提取器映射
 * 覆盖全部 28 种组件类型
 */
const SCHEMA_TYPE_MAP: Record<string, TypeExtractor> = {
  // v1.2 基础组件
  container: { extractProps: () => ({}) },
  section: { extractProps: () => ({}) },
  row: { extractProps: () => ({}) },
  column: { extractProps: () => ({}) },
  text: { extractProps: (el) => extractTextProps(el) },
  image: { extractProps: (el) => extractImageProps(el) },
  button: { extractProps: (el, comp) => extractButtonProps(el, comp) },
  divider: { extractProps: (el) => extractDividerProps(el) },
  spacer: { extractProps: (el) => extractSpacerProps(el) },
  video: { extractProps: (el) => extractVideoProps(el) },
  'bilibili-video': { extractProps: (el) => extractBilibiliProps(el) },
  'tencent-video': { extractProps: (el) => extractTencentProps(el) },

  // v1.3 高级组件
  card: { extractProps: (el) => extractCardProps(el) },
  accordion: { extractProps: (el) => extractAccordionProps(el) },
  tabs: { extractProps: (el) => extractTabsProps(el) },
  carousel: { extractProps: (el) => extractCarouselProps(el) },
  map: { extractProps: (el) => extractMapProps(el) },
  'nav-menu': { extractProps: (el) => extractNavMenuProps(el) },
  'nav-link': { extractProps: (el) => extractNavLinkProps(el) },
  'html-embed': { extractProps: (el) => extractHtmlEmbedProps(el) },

  // v1.4 表单/数据组件
  form: { extractProps: (el) => extractFormProps(el) },
  'form-input': { extractProps: (el) => extractFormInputProps(el) },
  'form-textarea': { extractProps: (el) => extractFormTextareaProps(el) },
  'form-select': { extractProps: (el) => extractFormSelectProps(el) },
  'form-checkbox': { extractProps: (el) => extractFormCheckboxProps(el) },
  'form-submit': { extractProps: (el) => extractFormSubmitProps(el) },
  'data-list': { extractProps: (el) => extractDataListProps(el) },
  'data-badge': { extractProps: (el) => extractDataBadgeProps(el) },
};

/**
 * HTML 标签 → Schema 类型映射（回退方案）
 */
const TAG_TYPE_MAP: Record<string, string> = {
  DIV: 'container',
  SECTION: 'section',
  P: 'text',
  H1: 'text', H2: 'text', H3: 'text', H4: 'text', H5: 'text', H6: 'text',
  SPAN: 'text',
  LABEL: 'text',
  IMG: 'image',
  A: 'button',
  BUTTON: 'button',
  VIDEO: 'video',
  IFRAME: 'video',
  HR: 'divider',
  NAV: 'nav-menu',
  FORM: 'form',
  SELECT: 'form-select',
  TEXTAREA: 'form-textarea',
  INPUT: 'form-input',
};

/**
 * GrapesJS 类型 → Schema 类型映射（回退方案）
 */
const GRAPESJS_TYPE_MAP: Record<string, string> = {
  default: 'container',
  text: 'text',
  image: 'image',
  link: 'button',
  video: 'video',
  label: 'text',
  wrapper: 'container',
};

/* ==================== 工具函数 ==================== */

/** 解析内联样式字符串为对象（GrapesJS 输出已是 camelCase） */
function parseInlineStyle(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  styleStr.split(';').forEach((rule) => {
    const trimmed = rule.trim();
    if (!trimmed) return;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;
    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    result[key] = value;
  });
  return result;
}

/** 为节点生成唯一 ID */
function generateComponentId(comp: Component): string {
  if (comp.ccid) return `gjs_${comp.ccid}`;
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 推断组件 Schema 类型（三阶段优先级） */
function detectSchemaType(comp: Component, el: HTMLElement | null): string {
  // 1. 优先读取 data-schema-type
  if (el) {
    const schemaType = el.getAttribute('data-schema-type');
    if (schemaType) return schemaType;
  }

  // 2. 按 GrapesJS 类型映射
  const gjsType = comp.getType();
  const mappedType = GRAPESJS_TYPE_MAP[gjsType];
  if (mappedType) return mappedType;

  // 3. 按 HTML 标签映射
  if (el) {
    const tagType = TAG_TYPE_MAP[el.tagName.toUpperCase()];
    if (tagType) return tagType;
  }

  // 4. 默认容器
  return 'container';
}

/** 提取组件特定属性 */
function extractComponentProps(
  comp: Component,
  el: HTMLElement | null,
  type: string,
): Record<string, unknown> {
  if (!el) return {};

  const commonProps = extractCommonProps(el);

  // 按 data-schema-type 查找提取器
  const extractor = SCHEMA_TYPE_MAP[type];
  if (extractor) {
    return { ...commonProps, ...extractor.extractProps(el, comp) };
  }

  // 回退：按 HTML 标签提取
  const tag = el.tagName.toUpperCase();
  if (tag === 'IMG') return { ...commonProps, ...extractImageProps(el) };
  if (tag === 'A' || tag === 'BUTTON') return { ...commonProps, ...extractButtonProps(el, comp) };
  if (tag === 'VIDEO' || tag === 'IFRAME') return { ...commonProps, ...extractVideoProps(el) };
  if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'LABEL'].includes(tag)) {
    return { ...commonProps, ...extractTextProps(el) };
  }

  return commonProps;
}

/** 提取 data-events 属性中的事件绑定数据 */
function extractEvents(el: HTMLElement, comp?: Component): EventBinding[] | undefined {
  // 优先从组件 model 读取（通过 addAttributes 写入持久化的数据）
  if (comp) {
    const attrs = comp.getAttributes();
    const modelData = attrs['data-events'] as string | undefined;
    if (modelData) {
      try {
        const parsed = JSON.parse(modelData) as EventBinding[];
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
      } catch {
        // fallback to DOM
      }
    }
  }
  // 降级：从 DOM 属性读取（兼容旧数据）
  const data = el.getAttribute('data-events');
  if (!data) return undefined;
  try {
    const parsed = JSON.parse(data) as EventBinding[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/* ==================== 核心转换函数 ==================== */

/**
 * 递归转换 GrapesJS 组件为 SchemaNode
 */
function convertComponent(comp: Component): SchemaNode | null {
  const el = comp.getEl();
  if (!el) return null;

  const id = generateComponentId(comp);
  const type = detectSchemaType(comp, el);
  const props = extractComponentProps(comp, el, type);

  const events = el ? extractEvents(el, comp) : undefined;
  const node: SchemaNode = { id, type, props, ...(events ? { events } : {}) };

  // 递归处理子组件
  const childComponents = comp.components();
  if (childComponents && childComponents.length > 0) {
    const children: SchemaNode[] = [];
    childComponents.each((child: Component) => {
      if (child.getType() === 'textnode') return;
      const childNode = convertComponent(child);
      if (childNode) {
        children.push(childNode);
      }
    });
    if (children.length > 0) {
      node.children = children;
    }
  }

  return node;
}

/**
 * 从 GrapesJS 编辑器构建页面 Schema
 */
export function buildPageSchema(editor: Editor): PageSchema {
  const wrapper = editor.getWrapper();
  if (!wrapper) {
    return { root: { id: 'root', type: 'container', props: {} } };
  }

  const root = convertComponent(wrapper);
  return {
    root: root || { id: 'root', type: 'container', props: {} },
    // 提取 GrapesJS CSS Composer 中的全局样式规则（类选择器、媒体查询等）
    // 这些是用户在 GrapesJS Style Manager 中设置的样式，非内联样式
    css: editor.getCss() || undefined,
  };
}

/**
 * 从 GrapesJS 编辑器构建页面 Schema 并序列化
 */
export function buildPageSchemaJson(editor: Editor): string {
  const schema = buildPageSchema(editor);
  return JSON.stringify(schema);
}

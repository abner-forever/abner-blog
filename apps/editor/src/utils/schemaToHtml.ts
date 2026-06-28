/**
 * Schema → GrapesJS HTML 反向转换器
 *
 * 将 PageSchema（SchemaNode 树）转换为带 data-schema-type 属性的 HTML 字符串，
 * 用于在 GrapesJS 编辑器中加载 AI 生成的页面内容。
 *
 * 与 schemaConverter.ts（GrapesJS HTML → SchemaNode）形成双向转换对。
 */

import type { PageSchema, SchemaNode } from '@abner-blog/page-schema';

/**
 * 将 SchemaNode 树转换为 HTML 字符串
 *
 * @param schema - PageSchema 对象或 SchemaNode 根节点
 * @returns 带 data-schema-type 属性的 HTML 字符串
 */
export function schemaToHtml(schema: PageSchema | SchemaNode): string {
  let root: SchemaNode;

  if ('root' in schema) {
    root = schema.root;
  } else {
    root = schema;
  }

  if (!root) {
    return '<div data-gjs-type="page-content"><h1 style="text-align:center;padding:40px;color:#999">空的页面</h1></div>';
  }

  const pageContent = root.children || [];
  const contentHtml = pageContent.map((child) => nodeToHtml(child)).join('\n');

  // Wrap in dual-region structure for GrapesJS editor
  return `<div data-gjs-type="page-content">${contentHtml}</div>
<div data-gjs-type="modals-container" style="display:none"></div>`;
}

/**
 * 递归将 SchemaNode 转换为 HTML
 */
function nodeToHtml(node: SchemaNode): string {
  const { type, props = {}, children } = node;
  const tag = getTagForType(type);
  const dataAttr = `data-schema-type="${type}"`;
  const idAttr = node.id ? ` id="${node.id}"` : '';
  const styleAttr = props.style ? ` style="${styleObjectToString(props.style as Record<string, string>)}"` : '';
  const classAttr = props.className ? ` class="${props.className}"` : '';

  // Handle specific component types
  switch (type) {
    case 'text': {
      const as = (props.as as string) || 'p';
      const content = (props.content as string) || '';
      return `<${as}${dataAttr}${idAttr}${styleAttr}${classAttr}>${escapeHtml(content)}</${as}>`;
    }

    case 'image': {
      const src = (props.src as string) || '';
      const alt = (props.alt as string) || '';
      const lazy = props.lazy ? ' loading="lazy"' : '';
      const widthAttr = props.width ? ` width="${props.width}"` : '';
      const heightAttr = props.height ? ` height="${props.height}"` : '';
      return `<img${dataAttr}${idAttr} src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${lazy}${widthAttr}${heightAttr}${styleAttr}${classAttr} />`;
    }

    case 'button': {
      const text = (props.text as string) || '按钮';
      const variant = (props.variant as string) || 'primary';
      return `<button${dataAttr}${idAttr}${styleAttr}${classAttr} data-variant="${variant}">${escapeHtml(text)}</button>`;
    }

    case 'divider': {
      const color = (props.color as string) || '#e8e8e8';
      const lineStyle = (props.style as string) || 'solid';
      const height = (props.height as number) || 1;
      return `<hr${dataAttr}${idAttr} style="border:none;border-top:${height}px ${lineStyle} ${color};margin:16px 0"${classAttr} />`;
    }

    case 'spacer': {
      const height = (props.height as number) || 40;
      return `<div${dataAttr}${idAttr} style="height:${height}px"${classAttr}></div>`;
    }

    case 'card': {
      const title = (props.title as string) || '';
      const description = (props.description as string) || '';
      const imageSrc = (props.imageSrc as string) || '';
      const href = (props.href as string) || '';
      const cardStyle = props.style ? styleObjectToString(props.style as Record<string, string>) : '';

      const inner: string[] = [];
      if (imageSrc) {
        inner.push(`<img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(props.imageAlt as string || '')}" style="width:100%;border-radius:8px 8px 0 0" />`);
      }
      inner.push(`<div style="padding:16px">`);
      if (title) inner.push(`<h3 style="margin:0 0 8px">${escapeHtml(title)}</h3>`);
      if (description) inner.push(`<p style="margin:0;color:#666">${escapeHtml(description)}</p>`);
      inner.push(`</div>`);

      const wrapperTag = href ? 'a' : 'div';
      const hrefAttr = href ? ` href="${escapeAttr(href)}"` : '';
      return `<${wrapperTag}${dataAttr}${idAttr}${hrefAttr} style="border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);background:#fff;${cardStyle}"${classAttr}>\n${inner.join('\n')}\n</${wrapperTag}>`;
    }

    case 'carousel': {
      const slides = (props.slides as string[]) || [];
      const interval = (props.interval as number) || 3000;
      const autoplay = props.autoplay !== false;
      const indicators = props.indicators !== false;

      const slidesHtml = slides
        .map(
          (src, i) =>
            `<div data-carousel-slide="${i}" style="${i > 0 ? 'display:none' : ''}"><img src="${escapeAttr(src)}" style="width:100%;height:400px;object-fit:cover" /></div>`,
        )
        .join('\n');

      return `<div${dataAttr}${idAttr} style="position:relative;overflow:hidden;${styleAttr ? styleObjectToString(props.style as Record<string, string>) : ''}" data-interval="${interval}" data-autoplay="${autoplay}" data-indicators="${indicators}"${classAttr}>
        <div data-carousel-inner>${slidesHtml}</div>
      </div>`;
    }

    case 'nav-menu': {
      const items = (props.items as Array<{ label: string; href: string }>) || [];
      const sticky = props.sticky !== false;
      const linksHtml = items
        .map((item) => `<a data-schema-type="nav-link" href="${escapeAttr(item.href)}" style="color:inherit;text-decoration:none;padding:8px 16px">${escapeHtml(item.label)}</a>`)
        .join('\n');

      return `<nav${dataAttr}${idAttr} style="display:flex;align-items:center;padding:0 24px;background:#fff;${sticky ? 'position:sticky;top:0;z-index:100;' : ''}${styleAttr ? styleObjectToString(props.style as Record<string, string>) : ''}"${classAttr}>
        ${linksHtml}
      </nav>`;
    }

    case 'form': {
      const api = (props.api as string) || '';
      const method = (props.method as string) || 'POST';
      const submitLabel = (props.submitLabel as string) || '提交';
      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';

      return `<form${dataAttr}${idAttr} action="${escapeAttr(api)}" method="${method}" style="max-width:600px;margin:0 auto;${styleAttr ? styleObjectToString(props.style as Record<string, string>) : ''}"${classAttr}>
        ${childrenHtml}
      </form>`;
    }

    case 'accordion': {
      const items = (props.items as Array<{ title: string }>) || [];
      const accordionsHtml = items
        .map(
          (item, i) =>
            `<details${i === 0 ? ' open' : ''} style="border:1px solid #e8e8e8;border-radius:4px;margin-bottom:8px;overflow:hidden">
              <summary style="padding:12px 16px;cursor:pointer;font-weight:500;background:#fafafa">${escapeHtml(item.title)}</summary>
              <div style="padding:12px 16px"></div>
            </details>`,
        )
        .join('\n');

      return `<div${dataAttr}${idAttr}${styleAttr}${classAttr}>${accordionsHtml}</div>`;
    }

    case 'tabs': {
      const tabLabels = (props.tabLabels as string[]) || [];
      const activeIndex = (props.activeIndex as number) || 0;
      const tabsHeader = tabLabels
        .map(
          (label, i) =>
            `<button data-tab="${i}" style="padding:8px 20px;border:none;background:${i === activeIndex ? '#fff' : 'transparent'};cursor:pointer;font-size:14px;${i === activeIndex ? 'border-bottom:2px solid #2f81f7;font-weight:500' : ''}">${escapeHtml(label)}</button>`,
        )
        .join('');

      const tabsContent = children
        ? children
            .map(
              (child, i) =>
                `<div data-tab-content="${i}" style="padding:16px;${i !== activeIndex ? 'display:none' : ''}">${nodeToHtml(child)}</div>`,
            )
            .join('\n')
        : '';

      return `<div${dataAttr}${idAttr}${styleAttr}${classAttr}>
        <div style="display:flex;border-bottom:1px solid #e8e8e8">${tabsHeader}</div>
        ${tabsContent}
      </div>`;
    }

    case 'modal': {
      const modalName = (props.name as string) || '弹窗';
      const modalTitle = (props.title as string) || '';
      const modalWidth = (props.width as number) || 520;
      const closable = props.closable !== false;
      const animation = (props.animation as string) || 'fade';

      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';

      return `<div${dataAttr}${idAttr}${styleAttr} data-modal-name="${escapeAttr(modalName)}" data-modal-title="${escapeAttr(modalTitle)}" data-modal-width="${modalWidth}" data-modal-closable="${closable}" data-modal-animation="${animation}"${classAttr}>
        ${childrenHtml}
      </div>`;
    }

    case 'row': {
      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';
      return `<div${dataAttr}${idAttr} style="display:flex;flex-wrap:wrap;gap:16px;${styleAttr ? styleObjectToString(props.style as Record<string, string>) : ''}"${classAttr}>
        ${childrenHtml}
      </div>`;
    }

    case 'column': {
      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';
      return `<div${dataAttr}${idAttr} style="flex:1;min-width:240px;${styleAttr ? styleObjectToString(props.style as Record<string, string>) : ''}"${classAttr}>
        ${childrenHtml}
      </div>`;
    }

    case 'section': {
      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';
      return `<section${dataAttr}${idAttr}${styleAttr}${classAttr}>
        ${childrenHtml}
      </section>`;
    }

    case 'container':
    default: {
      // For container and any unknown types, render as div
      const childrenHtml = children ? children.map((c) => nodeToHtml(c)).join('\n') : '';
      return `<div${dataAttr}${idAttr}${styleAttr}${classAttr}>
        ${childrenHtml}
      </div>`;
    }
  }
}

/**
 * 获取组件类型对应的默认 HTML 标签
 */
function getTagForType(type: string): string {
  const tagMap: Record<string, string> = {
    container: 'div',
    section: 'section',
    row: 'div',
    column: 'div',
    text: 'p',
    image: 'img',
    button: 'button',
    divider: 'hr',
    spacer: 'div',
    video: 'video',
    'bilibili-video': 'iframe',
    'tencent-video': 'iframe',
    card: 'div',
    accordion: 'div',
    tabs: 'div',
    carousel: 'div',
    map: 'div',
    'nav-menu': 'nav',
    'nav-link': 'a',
    'html-embed': 'div',
    modal: 'div',
    form: 'form',
    'form-input': 'div',
    'form-textarea': 'div',
    'form-select': 'div',
    'form-checkbox': 'div',
    'form-submit': 'div',
    'data-list': 'div',
    'data-badge': 'div',
  };

  return tagMap[type] || 'div';
}

/**
 * 将 CSS-in-JS 样式对象转换为内联样式字符串
 */
function styleObjectToString(style: Record<string, string | number>): string {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}:${value}`;
    })
    .join(';');
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 转义 HTML 属性值
 */
function escapeAttr(value: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 将 PageSchema 包装为 GrapesJS onLoad 可接受的格式
 *
 * @returns { project: { pages: [{ component: string }] } }
 */
export function schemaToGrapesJSProject(
  schema: PageSchema | SchemaNode,
  pageName?: string,
): { project: { pages: Array<{ name: string; component: string }> } } {
  const html = schemaToHtml(schema);
  return {
    project: {
      pages: [
        {
          name: pageName || 'AI 生成的页面',
          component: html,
        },
      ],
    },
  };
}

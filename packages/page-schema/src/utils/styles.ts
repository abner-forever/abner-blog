/**
 * 样式工具函数
 *
 * 提供 CSS 解析、样式注入等辅助功能。
 * v1 实现基础工具，后续可扩展响应式、主题等。
 */

/**
 * CSS 字符串 → React.CSSProperties 的简单转换
 *
 * 支持基本属性：color, background, margin, padding, font-size 等
 * 仅用于简单场景，复杂 CSS 请直接使用 node.props.style
 *
 * @param cssText - CSS 样式文本（如 "color: red; font-size: 14px"）
 * @returns React.CSSProperties 对象
 */
export function cssTextToStyle(cssText?: string): React.CSSProperties {
  if (!cssText) return {};

  const style: Record<string, string> = {};

  cssText.split(';').forEach((declaration) => {
    const trimmed = declaration.trim();
    if (!trimmed) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;

    const prop = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (prop && value) {
      // 驼峰转换：font-size → fontSize
      const camelProp = prop.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      style[camelProp] = value;
    }
  });

  return style as React.CSSProperties;
}

/**
 * 合并多个样式对象（后面的覆盖前面的同名属性）
 *
 * @param styles - 样式对象数组
 * @returns 合并后的样式对象
 */
export function mergeStyles(
  ...styles: (React.CSSProperties | undefined | null)[]
): React.CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * 构建 className 字符串（过滤掉空值）
 *
 * @param classNames - className 值数组
 * @returns 合并后的 className 字符串
 */
export function buildClassName(
  ...classNames: (string | undefined | null | false)[]
): string | undefined {
  const result = classNames.filter(Boolean).join(' ').trim();
  return result || undefined;
}

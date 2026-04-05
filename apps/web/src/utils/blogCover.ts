import type { CSSProperties } from 'react';

/**
 * 10 个默认封面渐变（当博客未设置封面时随机展示）
 * 根据 blog.id 取模保证同一篇文章始终显示相同兜底封面
 */
export const DEFAULT_COVERS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫蓝
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 粉红
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // 天蓝
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // 薄荷绿
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // 橘粉
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // 薰衣草
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', // 暖橙紫
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // 浅蓝
  'linear-gradient(135deg, #fd7043 0%, #ffa726 100%)', // 日落橙
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // 翠绿
];

/**
 * 获取博客封面样式
 * - 有封面 URL → 返回 { backgroundImage: `url(${cover})` }
 * - 无封面    → 根据 id 返回固定渐变兜底
 */
export function getBlogCoverStyle(
  cover: string | null | undefined,
  blogId: number,
): CSSProperties {
  if (cover) {
    return {
      backgroundImage: `url(${cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  const gradient = DEFAULT_COVERS[blogId % DEFAULT_COVERS.length];
  return { background: gradient };
}

/**
 * 是否有真实封面 URL（非空）
 */
export function hasCover(cover: string | null | undefined): cover is string {
  return typeof cover === 'string' && cover.trim().length > 0;
}

const HEX = '0123456789abcdef';
const cache = new Map<string, string>();

/** 为每个环境 key 生成稳定随机色（与原 min 逻辑一致：首次随机后缓存） */
export function colorForEnvKey(key: string): string {
  if (!key) throw new Error('key is required');
  const hit = cache.get(key);
  if (hit) return hit;
  const part = Array.from({ length: 6 }, () =>
    HEX[Math.floor(Math.random() * HEX.length)],
  ).join('');
  const color = `#${part}`;
  cache.set(key, color);
  return color;
}

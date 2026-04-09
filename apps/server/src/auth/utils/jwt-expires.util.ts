/**
 * 将 JWT `expiresIn` 风格字符串转为秒（供 Redis TTL）。
 * 支持：纯数字（秒）、15m、2h、7d（大小写不敏感）。
 */
export function jwtExpiresInToSeconds(expiresIn: string): number {
  const t = expiresIn.trim();
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10);
  }
  const m = /^(\d+)\s*([smhd])$/i.exec(t);
  if (!m) {
    return 15 * 60;
  }
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return n * (mult[u] ?? 60);
}

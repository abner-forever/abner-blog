import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/** 单次进程内写入上限，避免大流量时刷爆磁盘；需更多时可重启后端或调大 */
const MAX_LINES_PER_BOOT = 300;
let linesWritten = 0;

/**
 * 设置 AI_CHAT_DEBUG=1 时，向 logs/ai-stream-debug-YYYY-MM-DD.log 写入 MiniMax 流式 delta 摘要（不含正文内容，仅长度与字段名）。
 */
export function appendAiStreamDebugLine(line: string): void {
  if (process.env.AI_CHAT_DEBUG !== '1') return;
  if (linesWritten >= MAX_LINES_PER_BOOT) return;
  try {
    const base = join(process.cwd(), 'logs');
    if (!existsSync(base)) mkdirSync(base, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    appendFileSync(
      join(base, `ai-stream-debug-${day}.log`),
      `[${new Date().toISOString()}] ${line}\n`,
      'utf8',
    );
    linesWritten += 1;
  } catch {
    // 排错日志失败不影响主流程
  }
}

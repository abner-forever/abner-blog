/** 将常见 LLM 厂商错误码转为用户可读说明（流式 error 事件、日志等）。 */
export function mapLlmErrorForUser(raw: string): string {
  const msg = raw.trim();
  if (!msg) return raw;
  if (/new_sensitive|output new_sensitive|\(\s*1027\s*\)|\b1027\b/i.test(msg)) {
    return (
      '当前模型触发了输出安全策略（常见于涉及时事、新闻摘要等场景），本次未返回正文。可尝试更换模型或供应商、缩短检索问题后再试。'
    );
  }
  return raw;
}

/** 与 GitHub MCP 类似：在 CHAT + MCP 场景下决定是否走「网页检索」能力（不单独占意图枚举）。 */
export function shouldOfferWebSearchMcp(message: string): boolean {
  const text = message.trim();
  if (!text) return false;

  const hasNewsOrPublicInfo =
    /(新闻|资讯|热点|头条|时事|快讯|要闻|最新消息|今日要闻|国内消息|国际消息|热搜)/i.test(
      text,
    );
  const hasExplicitWebSearch =
    /(联网搜索|联网查|网上搜索|网上查|上网搜|用搜索引擎|search\s+the\s+web|web\s*search)/i.test(
      text,
    );
  const hasTaskOrWeatherNoun =
    /(待办|todo|任务|日程|安排|行程|天气|气温|温度|下雨|降雨|晴天|风力|风速)/i.test(
      text,
    );
  const hasLooseWebSearchVerb =
    /(搜一下|搜索一下|帮我搜|检索一下|查一下网上|上网查|百度一下|google一下)/i.test(
      text,
    );
  if (hasExplicitWebSearch) return true;
  if (hasNewsOrPublicInfo) return true;
  if (hasLooseWebSearchVerb && !hasTaskOrWeatherNoun) return true;
  return false;
}

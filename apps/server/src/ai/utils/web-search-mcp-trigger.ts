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
  /** 体育赛事 / 实时比分 / 赛程查询：需要联网获取最新信息 */
  const hasSportsOrLiveEvent =
    /(世界杯|奥运会|NBA|CBA|欧冠|英超|西甲|意甲|德甲|中超|亚冠|足球赛|篮球赛|网球|F1|赛车|电竞|LOL|王者荣耀|比分|赛程|比赛|赛事|对局|对阵|晋级|淘汰|决赛|半决赛|小组赛)/i.test(
      text,
    );
  /** 明确的时间 + 信息查询组合（如"明天…谁跟谁"、"今天…几点"） */
  const hasTimePlusQuery =
    /(明天|今天|昨晚|昨天|后天|大后天|本周|下周|这周|这星期|下星期)/.test(
      text,
    ) && /(谁|哪[个支队]|几[点比]|比分|结果|时间|赛程|对阵)/.test(text);
  if (hasExplicitWebSearch) return true;
  if (hasNewsOrPublicInfo) return true;
  if (hasSportsOrLiveEvent) return true;
  if (hasTimePlusQuery && !hasTaskOrWeatherNoun) return true;
  if (hasLooseWebSearchVerb && !hasTaskOrWeatherNoun) return true;
  return false;
}

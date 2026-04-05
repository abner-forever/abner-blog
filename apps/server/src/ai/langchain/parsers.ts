export function getTextContent(result: { content: unknown }): string {
  if (typeof result.content === 'string') return result.content;
  if (result.content && typeof result.content === 'object') {
    return JSON.stringify(result.content);
  }
  return '';
}

export function parseJson(text: string): Record<string, unknown> | null {
  try {
    let jsonStr = text.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];

    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    jsonStr = jsonStr.substring(start, end + 1);
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function cleanTitle(title: string): string {
  if (!title || typeof title !== 'string') return title;

  let cleaned = title.trim();
  cleaned = cleaned
    .replace(/^下周[一二三四五六日天]/, '')
    .replace(/^(本周|这周|周)[一二三四五六日天]/, '')
    .replace(/^清明节?/, '')
    .trim();

  const dateTimePatterns = [
    '明天上午',
    '明天下午',
    '明天晚上',
    '明天早上',
    '今天上午',
    '今天下午',
    '今天晚上',
    '今天早上',
    '后天上午',
    '后天下午',
    '后天晚上',
    '后天早上',
    '明天',
    '今天',
    '后天',
    '明上午',
    '明下午',
    '明晚上',
    '明早',
    '今上午',
    '今下午',
    '今晚上',
    '今早',
    '后上午',
    '后下午',
    '后晚上',
    '后早',
    '明',
    '今',
    '后',
    '上午',
    '下午',
    '晚上',
    '早上',
    '中午',
    '凌晨',
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of dateTimePatterns) {
      if (cleaned.startsWith(pattern)) {
        cleaned = cleaned.substring(pattern.length).trim();
        changed = true;
        break;
      }
    }
  }

  cleaned = cleaned.replace(
    /^[\d]+[\s\-:：到至，,。.点]*[\d]*[时分]?(?:半)?/,
    '',
  );

  return cleaned.trim() || title;
}

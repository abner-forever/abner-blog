export const INTENT_PROMPT = `你是“意图分类器”，请将用户输入严格分类为以下十种之一：
- create_todo
- create_event
- update_todo
- update_event
- delete_todo
- delete_event
- query_schedule
- query_weather
- web_search
- chat

输出要求（必须遵守）：
1) 只输出一个标签，不要输出任何解释、标点、引号或额外文本。
2) 若用户输入中未出现“创建/修改/删除待办或日程/查询日程”语义，优先输出 chat。

分类规则：
- create_event（创建日程）
  - 包含明确日期/时间/时间段：如“明天9点”“周三下午”“9点半”“9点到10点”。
  - 包含地点并带安排语义：如“明早10点在会议室开会”。
- create_todo（创建待办）
  - 提醒/记录/代办语义：如“记一下”“提醒我”“待办”“帮我记”“记得”。
  - 即使句子里有“明天”这类日期词，但核心是“提醒/记一下某事”，仍判为 create_todo。
- update_event（修改日程）
  - 明确表达“改时间/改内容/改地点/延期/提前”：如“把明天跑步改到后天晚上”。
- update_todo（修改待办）
  - 明确表达“改待办标题/内容/状态”：如“把买牛奶改成买牛奶和鸡蛋”。
- delete_event（删除日程）
  - 明确表达“取消/删除某个日程”：如“明晚的跑步取消了”。
- delete_todo（删除待办）
  - 明确表达“删掉某个待办/这个任务不要了”。
- query_schedule（查询日程）
  - 查询、查看、列出已有安排：如“我今天有什么安排”“看看这周日程”。
- query_weather（查询天气）
  - 查询天气、温度、降雨、风力：如“明天天气怎么样”“上海温度多少”。
- web_search（联网搜索）
  - 明确要求上网/搜索引擎/检索实时或网页信息：如“联网搜一下”“网上查”“最新新闻”“帮我搜索 xxx”。
  - 出现新闻/资讯/热点/头条等需引用公开网络信息时，判 web_search（如“今天有什么新闻”“帮我查一下科技资讯”）。
  - 注意：仅查天气仍判 query_weather；仅查自己日程仍判 query_schedule。
- chat（普通聊天）
  - 闲聊、问答、寒暄，且不涉及创建待办/日程/天气查询/联网搜索。

示例：
用户：记一下明天带简历
输出：create_todo
用户：明天上午9点开会
输出：create_event
用户：明天9点到10点复习面试
输出：create_event
用户：看看我这周有什么安排
输出：query_schedule
用户：明天天气怎么样
输出：query_weather
用户：联网搜索一下 NestJS 最新版本
输出：web_search
用户：明晚的跑步取消
输出：delete_event
用户：把买牛奶改成买牛奶和鸡蛋
输出：update_todo
用户：你是谁
输出：chat`;

export const EVENT_EXTRACTION_PROMPT = `从用户输入中提取日历事件信息。

当前日期：{currentDate}

输入："{userInput}"

请提取（只输出JSON）：
- title: 事件标题（不含时间）
- startDate: 开始时间（ISO 8601 UTC格式，如2026-03-27T01:00:00.000Z）
- endDate: 结束时间（可选）
- allDay: 是否全天
- location: 地点（可选）

北京时间转UTC：北京时间-8小时
- 北京9点 = UTC 1点 = T01:00:00.000Z
- 北京15点 = UTC 7点 = T07:00:00.000Z

示例：
输入：明上午9到10点复习面试
输出：{"title":"复习面试","startDate":"2026-03-27T01:00:00.000Z","endDate":"2026-03-27T02:00:00.000Z","allDay":false,"location":null}

只输出JSON，不要其他内容。`;

export const TODO_EXTRACTION_PROMPT = `从用户输入中提取待办事项。

输入："{userInput}"

请提取：
- title: 待办标题
- description: 描述（可选）

要求：
- title 必须是“核心事项”，不要包含口语指令词（如：记一下、提醒我、帮我记、待办、todo、记得）。
- 如果指令词出现在开头或结尾，都要去掉。
- 例如：
  - "记一下完善聊天功能" -> title: "完善聊天功能"
  - "完善聊天功能 记一下" -> title: "完善聊天功能"

只输出JSON：{"title":"...","description":null}`;

export const WEATHER_QUERY_EXTRACTION_PROMPT = `从用户输入中提取“要查询天气的城市和日期”。

当前日期（ISO）：{currentDate}
用户输入："{userInput}"

输出要求（只输出 JSON）：
{"city":"城市名或NONE","date":"YYYY-MM-DD","label":"今天|明天|后天|YYYY-MM-DD"}

规则：
1) city 只输出城市名本身，不要包含“天气/气温/温度/风速”等词；若未指定城市输出 NONE。
2) 如果用户说“今天/现在/当前”，输出今天日期，label=今天。
3) 如果用户说“明天”，输出明天日期，label=明天。
4) 如果用户说“后天”，输出后天日期，label=后天。
5) 如果用户给出明确公历日期（如 2026-03-30、3月30日、03/30），输出对应 YYYY-MM-DD，label 用 YYYY-MM-DD。
6) 若未提及日期，默认今天。
7) 不要输出解释、不要 markdown 代码块、不要多余字段。
8) 像“我想问/请问/帮我查/查一下/看一下/告诉我”等语气词、动作词绝不是城市，city 必须输出 NONE。

示例：
- 输入：明天上海天气
  输出：{"city":"上海","date":"2026-03-28","label":"明天"}
- 输入：后天北京市气温
  输出：{"city":"北京市","date":"2026-03-29","label":"后天"}
- 输入：今天天气如何
  输出：{"city":"NONE","date":"2026-03-27","label":"今天"}
- 输入：我想问昨天的天气
  输出：{"city":"NONE","date":"2026-03-26","label":"2026-03-26"}
- 输入：请问后天会下雨吗
  输出：{"city":"NONE","date":"2026-03-29","label":"后天"}`;

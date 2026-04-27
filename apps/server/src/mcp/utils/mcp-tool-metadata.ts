interface McpToolMetadataItem {
  title: string;
  description: string;
}

export const MCP_TOOL_METADATA: Record<string, McpToolMetadataItem> = {
  get_weather: {
    title: '获取天气信息',
    description: `获取指定城市的天气信息，包括温度、天气状况、风速等。

使用场景：
- 用户询问某个城市的天气时使用
- 可以指定日期查询（默认今天）
- 会同时返回空气质量和建议

参数：
- city: 城市名称，如"北京"、"上海"、"深圳"
- date: 可选，日期格式 YYYY-MM-DD，如 "2026-04-08"`,
  },
  get_air_quality: {
    title: '获取空气质量',
    description: `获取指定城市的空气质量信息，包括 AQI、污染物浓度、健康建议等。

使用场景：
- 用户询问空气质量时使用
- 会返回详细的污染物数据和健康建议
- 适合提醒敏感人群是否适合外出`,
  },
  list_events: {
    title: '列出日程',
    description: `列出指定日期范围内的所有日程。

使用场景：
- 用户查询某天/某周/某月的日程安排时使用
- 需要提供开始和结束日期
- 会返回日程的标题、时间、地点等信息

参数：
- startDate: 开始日期，格式 YYYY-MM-DD
- endDate: 结束日期，格式 YYYY-MM-DD`,
  },
  create_event: {
    title: '创建日程',
    description: `创建一个新的日程/事件。

使用场景：
- 用户要求创建日程、会议、提醒时使用
- 需要提供日程标题和开始时间
- 可选提供结束时间、地点、描述等

参数：
- title: 日程标题，如"团队周会"、"医生预约"
- startDate: 开始时间，ISO 8601 格式
- endDate: 可选，结束时间
- allDay: 可选，是否全天事件
- location: 可选，地点
- description: 可选，描述`,
  },
  update_event: {
    title: '更新日程',
    description: `更新一个已存在的日程。

使用场景：
- 用户要求修改日程的时间、地点、内容时使用
- 需要提供日程 ID 和要修改的字段

参数：
- id: 日程 ID（必填）
- title: 新标题（可选）
- startDate: 新开始时间（可选）
- endDate: 新结束时间（可选）
- location: 新地点（可选）
- completed: 是否已完成（可选）`,
  },
  delete_event: {
    title: '删除日程',
    description: `删除一个已存在的日程。

使用场景：
- 用户要求取消或删除某个日程时使用
- 需要提供日程 ID

参数：
- id: 要删除的日程 ID（必填）`,
  },
  list_todos: {
    title: '列出待办',
    description: `列出用户的待办事项。

使用场景：
- 用户查询自己的待办列表时使用
- 可以筛选已完成/未完成的待办
- 会返回待办的标题、描述、完成状态等

参数：
- completed: 可选，true 返回已完成的，false 返回未完成的`,
  },
  create_todo: {
    title: '创建待办',
    description: `创建一个新的待办事项。

使用场景：
- 用户要求记录待办、提醒时使用
- 只需要提供标题
- 可选提供详细描述

参数：
- title: 待办标题，如"完成项目报告"
- description: 可选，详细描述`,
  },
  update_todo: {
    title: '更新待办',
    description: `更新一个已存在的待办事项。

使用场景：
- 用户要求修改待办内容或标记完成时使用
- 需要提供待办 ID 和要修改的字段

参数：
- id: 待办 ID（必填）
- title: 新标题（可选）
- description: 新描述（可选）
- completed: 是否已完成（可选）`,
  },
  delete_todo: {
    title: '删除待办',
    description: `删除一个已存在的待办事项。

使用场景：
- 用户要求删除某个待办时使用
- 需要提供待办 ID

参数：
- id: 要删除的待办 ID（必填）`,
  },
  get_user_info: {
    title: '获取用户信息',
    description: `获取用户资料信息。

使用场景：
- 用户询问“我的用户信息/个人资料”时使用
- 管理员可按用户 ID 查询任意用户
- 普通用户仅可查询自己

参数：
- id: 可选，用户 ID。不传默认查询当前登录用户`,
  },
};

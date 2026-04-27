import type { McpCapabilityCatalogDef } from './mcp-capability-catalog.types';

/**
 * 单一数据源：内置分组 + 可安装的远端能力模板。
 * 内置条目通过 matchTool 与 McpService.listTools() 对齐。
 */
export const MCP_CAPABILITY_CATALOG: McpCapabilityCatalogDef[] = [
  {
    kind: 'builtin',
    id: 'weather',
    name: '天气助手',
    description: '查询天气与空气质量（系统内置）',
    icon: 'cloud',
    matchTool: (toolName) =>
      toolName.startsWith('get_weather') ||
      toolName.startsWith('get_air_quality'),
  },
  {
    kind: 'builtin',
    id: 'calendar',
    name: '日程助手',
    description: '管理个人日程（系统内置）',
    icon: 'calendar',
    matchTool: (toolName) =>
      toolName === 'list_events' || toolName.endsWith('_event'),
  },
  {
    kind: 'builtin',
    id: 'todo',
    name: '待办助手',
    description: '管理待办事项（系统内置）',
    icon: 'check-square',
    matchTool: (toolName) =>
      toolName === 'list_todos' || toolName.endsWith('_todo'),
  },
  {
    kind: 'builtin',
    id: 'user',
    name: '用户助手',
    description: '管理用户信息（系统内置）',
    icon: 'user',
    matchTool: (toolName) => toolName === 'get_user_info',
  },
  {
    kind: 'remote',
    id: 'github',
    name: 'GitHub 集成',
    description:
      '仓库、Issue、PR 等 GitHub 能力（需配置可访问的本服务 MCP 地址）',
    icon: 'github',
    tools: ['get_repo', 'create_issue', 'list_issues', 'list_prs', 'create_pr'],
    useInternalGithubEndpoint: true,
    defaultConfig: {
      bearerToken: '',
      timeoutMs: 12000,
      headers: {},
    },
  },
  {
    kind: 'remote',
    id: 'slack',
    name: 'Slack 集成',
    description: '消息发送与频道管理能力（市场扩展）',
    icon: 'slack',
    tools: ['send_message', 'list_channels', 'get_channel_info'],
  },
  {
    kind: 'remote',
    id: 'filesystem',
    name: '文件系统',
    description: '文件读写与目录管理能力（市场扩展）',
    icon: 'folder',
    tools: ['read_file', 'write_file', 'list_directory', 'create_directory'],
  },
  {
    kind: 'remote',
    id: 'web-search',
    name: '网页检索',
    description:
      '本服务托管：Tavily/Brave 联网搜索与网页正文摘要（需配置 TAVILY_API_KEY 或 BRAVE_SEARCH_API_KEY）',
    icon: 'search',
    tools: ['search', 'get_page_content'],
    useInternalWebSearchEndpoint: true,
    defaultConfig: {
      bearerToken: '',
      timeoutMs: 25000,
      headers: {},
    },
  },
  {
    kind: 'remote',
    id: 'database',
    name: '数据库',
    description: 'SQL 查询与表结构读取能力（市场扩展）',
    icon: 'database',
    tools: ['execute_query', 'list_tables', 'describe_table'],
  },
];

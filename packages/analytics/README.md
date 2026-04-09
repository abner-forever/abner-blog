# @abner/analytics

Abner Blog 前端埋点 SDK，用于采集事件与性能指标，并上报到服务端分析接口。

## 功能特性

- 事件埋点：手动埋点（`track`）+ 页面访问埋点（`trackPageView`）
- 自动埋点：页面浏览、点击、JS 错误、Promise 未处理错误、`fetch` 异常、路由历史变更
- 性能指标：LCP、FID、CLS、FCP、TTFB 等
- 离线队列：本地队列缓存与重试机制，网络恢复后自动 flush
- 身份标识：匿名 ID（`localStorage`）+ 会话 ID（`sessionStorage`）

## 安装与构建

该包位于 monorepo `packages/analytics`，通常通过 workspace 依赖消费。

```bash
pnpm --filter @abner/analytics build
```

常用脚本：

- `pnpm --filter @abner/analytics build`：构建 CJS/ESM + d.ts
- `pnpm --filter @abner/analytics dev`：watch 构建
- `pnpm --filter @abner/analytics typecheck`：类型检查
- `pnpm --filter @abner/analytics lint`：代码检查

## 快速开始

```ts
import { initAnalytics, track, trackPageView, setUserId } from '@abner/analytics';

const analytics = initAnalytics({
  appId: 'abner-web',
  serverUrl: 'https://your-api.example.com',
  autoTrack: true,
  sampleRate: 0.15,
  debug: false,
  getToken: () => localStorage.getItem('token'),
});

setUserId(10001);
track('note_publish_click', { source: 'editor_toolbar' });
trackPageView();
```

## 配置项（`AnalyticsConfig`）

- `appId: string`：应用标识（必填）
- `serverUrl: string`：上报服务地址（必填）
- `sessionTimeout?: number`：会话超时时间（毫秒，默认 `30 * 60 * 1000`）
- `sampleRate?: number`：采样率（默认 `0.15`）
- `autoTrack?: boolean`：是否启用自动埋点（默认 `true`）
- `debug?: boolean`：调试日志开关（默认 `false`）
- `getToken?: () => string | null`：获取鉴权 token（会自动拼接 `Authorization: Bearer xxx`）

默认值来自 `DEFAULT_CONFIG`：

```ts
{
  sessionTimeout: 30 * 60 * 1000,
  sampleRate: 0.15,
  autoTrack: true,
  debug: false,
}
```

## 对外 API

### 单例便捷 API（推荐）

- `initAnalytics(config)`：初始化默认 tracker（幂等）
- `getAnalytics()`：获取默认 tracker 实例
- `track(eventName, eventData?)`：发送事件
- `trackPageView()`：发送页面访问事件
- `setUserId(userId)`：设置登录用户 ID
- `clearUser()`：清除用户并重建匿名/会话 ID
- `getAnonymousId()`：获取匿名 ID
- `getSessionId()`：获取会话 ID

### 实例 API

可通过 `createTracker({ config })` 创建实例，并调用：

- `init()`
- `track(eventName, eventData?)`
- `trackPageView()`
- `trackClick(element, eventName?, extra?)`
- `setUserId(userId)` / `clearUser()`
- `getQueueSize()`
- `destroy()`

## 自动埋点说明

`autoTrack` 启用后，默认打开：

- 页面浏览埋点（首屏 + history 变化）
- 点击埋点（可通过 `data-track*` 控制）
- JS 运行时错误与 Promise 未处理错误
- `fetch` 请求失败埋点（HTTP 4xx/5xx 与异常）

### 点击埋点的 data 属性约定

- `data-track`：标记该元素可追踪
- `data-track-event="xxx"`：自定义事件名（默认 `click`）
- `data-track-data='{"k":"v"}'`：额外数据（JSON 字符串或普通字符串）
- `data-track-ignore`：显式忽略该节点

示例：

```html
<button
  data-track
  data-track-event="note_submit_click"
  data-track-data='{"source":"editor_footer"}'
>
  发布
</button>
```

## 上报接口约定

SDK 默认会调用以下接口：

- 事件上报：`POST {serverUrl}/api/analytics/track`
- 批量事件：`POST {serverUrl}/api/analytics/track/batch`
- 性能上报：`POST {serverUrl}/api/analytics/performance`

请求头包含：

- `Content-Type: application/json`
- `x-anonymous-id`
- `x-session-id`
- `Authorization`（当 `getToken()` 返回值存在）

## 队列与重试机制

- 队列默认每 5 秒触发一次 flush
- 页面 `beforeunload` / `visibilitychange=hidden` 时会触发 flush
- 最大队列长度：`100`
- 单条最大重试次数：`3`
- 队列内容会持久化到 `localStorage`（key：`_a_q`）

## 导出清单

除主 API 外，还导出以下能力：

- `performanceCollector`：性能采集器
- `autoTracker`：自动埋点器
- `Queue`：队列实现
- 工具函数：`generateAnonymousId`、`generateSessionId`、`getClientInfo`、`getConnectionType`、`debounce` 等
- 类型：`AnalyticsConfig`、`TrackEvent`、`PerformanceMetrics`、`ClientInfo` 等

## 注意事项

- 该 SDK 依赖浏览器环境（`window/document/localStorage/sessionStorage`），不建议在 SSR 阶段直接执行
- `sampleRate` 为概率采样，低采样率下部分事件不会上报
- 若多应用共享域名，请确认 `_a_id`、`_s_id`、`_a_q` 键名不会与其他系统冲突

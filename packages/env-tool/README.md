# @abner-blog/env-tool

测试环境切换工具。通过 `sessionStorage` 持久化环境标识，供业务侧在请求拦截器中注入 `api-env` 等请求头。

## 功能概览

- 提供浮动入口按钮，在页面中切换环境配置
- 默认使用 `sessionStorage` 存储环境元信息（`ABNER_ENV_META`）
- 支持自定义存储后端（可接入桥接容器、远端存储等）
- 同时支持 ESM（代码内调用）与 IIFE（浏览器全局变量）两种接入方式

## 安装与构建

该包在 monorepo 内以 workspace 方式使用：

```bash
pnpm --filter @abner-blog/env-tool build
```

常用脚本：

- `pnpm --filter @abner-blog/env-tool build`：构建类型与 IIFE 产物
- `pnpm --filter @abner-blog/env-tool typecheck`：仅类型检查
- `pnpm --filter @abner-blog/env-tool build:iife:dev`：开发态 IIFE（不压缩）

## 导出项

主入口 `@abner-blog/env-tool`：

- `AbnerEnvTool`：默认单例
- `EnvTool`：类，可按需手动实例化
- 类型：`EnvMeta`、`EnvToolInitOptions`、`EnvToolStorage` 等
- 常量：`STORAGE_KEY`、`DEFAULT_META`、`ENV_OPTIONS`、`ENV_WITHOUT_BRANCH_KEY`
- 工具：`parseStoredMeta`、`mergeStorage`、`createSessionStorageBackend`

浏览器 IIFE 入口 `@abner-blog/env-tool/browser`：

- 挂载全局变量 `AbnerEnvTool`（默认导出同名实例）

## 快速开始（ESM）

```ts
import { AbnerEnvTool } from '@abner-blog/env-tool';

AbnerEnvTool.init({
  debug: false,
  entryBtnStyle: {
    zIndex: 9999,
    position: { right: 16, bottom: 24 },
  },
});

const env = await AbnerEnvTool.getEnv();
// 例如：QA、TEST-123、ABNER-feature_xxx、自定义地址等
```

## 初始化参数

`init(options?: EnvToolInitOptions)` 支持以下配置：

- `debug?: boolean`
  - 输出初始化调试信息
- `entryBtnStyle?: { zIndex?: number; position?: Record<string, string | number> }`
  - 控制入口按钮层级与定位样式
- `storage?: Partial<EnvToolStorage> & EnvToolStorageBackend`
  - 覆盖默认存储行为（`getItem/setItem/removeItem`）
  - 可选覆盖 `parseEnv/getEnv/setEnv/clearEnv`

## 环境值规则

`getEnv()` 返回规则：

- 当 `env === "CUSTOM"`：返回 `key`（无 `key` 时返回空字符串）
- 其他环境：
  - `key` 存在：`${env}-${key}`
  - `key` 不存在：`${env}`

`ENV_OPTIONS` 默认包含：

- `CUSTOM`（需要 `key`）
- `ABNER`（需要 `key`）
- `TEST`（需要 `key`）

`ENV_WITHOUT_BRANCH_KEY` 默认包含：

- `QA`（不展示独立环境代号输入框）

## 存储协议

默认存储键：`ABNER_ENV_META`。

推荐存储值为 JSON 字符串，结构如下：

```ts
type EnvMeta = {
  env: string;
  key: string | null;
};
```

示例：

```json
{"env":"TEST","key":"123"}
```

兼容历史格式：若存储值为 `JSON.stringify("QA")`，会被解析为 `{ env: "QA", key: null }`。

## 自定义存储示例

```ts
import { AbnerEnvTool } from '@abner-blog/env-tool';

AbnerEnvTool.init({
  storage: {
    async getItem(key) {
      return window.sessionStorage.getItem(key);
    },
    async setItem(key, value) {
      window.sessionStorage.setItem(key, value);
    },
    async removeItem(key) {
      window.sessionStorage.removeItem(key);
    },
  },
});
```

## IIFE 使用示例

构建后引入 `dist/envtool.iife.js`，浏览器全局可用：

```html
<script src="/path/to/envtool.iife.js"></script>
<script>
  AbnerEnvTool.init();
  AbnerEnvTool.getEnv().then((env) => {
    console.log(env);
  });
</script>
```

## 注意事项

- 必须先调用 `init()`，再调用 `getEnv()`
- `init()` 具备幂等保护，重复调用不会重复挂载 UI
- 该包只负责“环境选择 + 持久化”，请求头注入逻辑需在业务层实现

# 数据来源系统设计

## 概述

当前 `VariableStore` 是纯运行时的内存存储，页面初始化时所有变量为 `undefined`，变量写入完全依赖用户交互触发的事件动作（`set-variable`、`call-api.assignTo`）。

本文档描述如何扩展 `VariableStore` 的初始化路径，支持三种新的声明式变量来源：

| 来源 | 触发时机 | 描述 |
|------|---------|------|
| **初始变量** (`initial`) | 页面挂载时同步 | 硬编码的默认值 |
| **URL 参数** (`urlMapping`) | 页面挂载时同步 | 从 URL search params 解析并映射为变量 |
| **API 数据源** (`dataSources`) | 页面挂载时异步串行 | 按序发起 HTTP 请求，响应存入变量 |

## 架构变化

```
Before:
  VariableStore 空 → 用户交互 → set-variable → 变量就绪

After:
  RendererProvider 挂载时自动执行初始化工序：
    ① initial（硬编码默认值）          ← 同步
    ② urlMapping（URL 参数→变量）       ← 同步，"有就覆盖，无则保留"
    ③ dataSources（串行 API 请求）      ← 异步，parallelGroup 内并行
    ④ 用户交互 → 事件动作              ← 独立，post-init
```

## Schema 类型扩展

```typescript
interface PageSchema {
  root: SchemaNode;
  css?: string;
  meta?: PageMeta;
  variables?: PageVariables;          // ← 新增
}

interface PageVariables {
  /** 初始变量值（硬编码默认值） */
  initial?: Record<string, unknown>;

  /** URL 参数到变量的映射 */
  urlMapping?: UrlMappingItem[];

  /** API 数据源配置（按序执行） */
  dataSources?: DataSourceItem[];

  /** 页面生命周期事件 */
  events?: {
    /**
     * 页面加载完成事件
     *
     * 在 initial + urlMapping 同步初始完后立即触发。
     * 此时动作配置中的 {{query.xxx}}、{{initialVar}} 等模板已可正常解析。
     * dataSources 是异步的，不阻塞此事件。如需等待数据源，使用 DataSourceItem.onSuccess。
     */
    onPageLoad?: EventAction[];
  };

  /** 扩展槽 —— 供后续或宿主自定义扩展 */
  extensions?: Record<string, unknown>;
}

interface UrlMappingItem {
  /**
   * 捕获全部 URL 参数存为一个对象
   * 设为 true 时，param/type/separator/default 不生效。
   * 后续通过 {{query.xxx}} 模板语法使用。
   */
  captureAll?: boolean;

  /** URL 参数名，如 ?id=xxx 中的 "id"（captureAll=true 时不生效） */
  param?: string;

  /** 对应的变量名（支持点号嵌套，如 "filters.price"） */
  as: string;

  /** 类型转换 */
  type?: 'string' | 'number' | 'boolean' | 'array';

  /**
   * 数组分隔符（仅 type=array 时生效）
   * 默认 ","，参数 ?tags=a,b,c → ["a", "b", "c"]
   */
  separator?: string;

  /**
   * 兜底默认值
   * 语义：仅当 URL 中没有该参数**且** initial 中也没有该变量时使用
   */
  default?: string;
}

interface DataSourceItem {
  /** 数据源名称（日志/调试用） */
  name: string;

  /** API 地址（支持 {{varName}} 模板语法，从 VariableStore 当前值解析） */
  url: string;

  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  headers?: Record<string, string>;

  body?: unknown;

  /** 响应存入的变量名（必填） */
  assignTo: string;

  /**
   * 并行分组
   * 同组数据源在同一个 Promise.all 中并行执行，
   * 不同组之间保持串行顺序。
   */
  parallelGroup?: string;

  /** 请求成功后的额外动作链（复用 EventAction[]） */
  onSuccess?: EventAction[];

  /** 请求失败后的额外动作链（复用 EventAction[]） */
  onError?: EventAction[];
}
```

## 初始化流水线

### 时序

```
RendererProvider mount
        │
        ▼
  ① store.setMany(variables.initial)
        │  同步，初始默认值落盘
        ▼
  ② 遍历 variables.urlMapping[]
        │  对每个映射：
        │    if (captureAll)         → 全部参数存为对象存到 store
        │    else if (param 存在)     → parseAndSet(param, as, type)
        │    else if (default 存在)   → store.set(as, default)
        │  同步，URL 参数就绪
        ▼
  ③ events.onPageLoad 动作链执行
        │  同步，{{query.xxx}}、{{initialVar}} 等模板已可正常解析
        │  示例：toast({ message: "你好 {{query.name}}！" })
        ▼
  ④ 遍历 variables.dataSources[]
        │  按数组顺序（同 parallelGroup 并行）：
        │    fetch(resolveTemplate(url, store.getAll()))
        │    → parse 响应 → store.set(assignTo, data)
        │    → 触发订阅该变量的组件重渲染
        │  异步，每完成一个即更新 UI
        ▼
  ⑤ 用户交互 → 事件动作（正常执行）
```

## 事件动作中的模板变量

所有事件动作的 config 字段在**执行时**会自动解析 `{{varName}}` 和 `{{query.xxx}}` 模板。

不需要手动写代码——配置时直接写模板字符串即可：

```json
// config 中的字符串值会自动解析 {{varName}}
{
  "id": "a1",
  "type": "toast",
  "config": {
    "message": "你好 {{query.name}}！"
  }
},
{
  "id": "a2",
  "type": "set-variable",
  "config": {
    "key": "message",
    "value": "欢迎来自 {{query.ref}} 的用户"
  }
}
```

实现原理：`executor.ts` 的 `executeActions` 在调用 handler 之前，先对 `action.config` 运行 `resolveObjectTemplates`（递归解析所有字符串值中的 `{{}}` 模板），替换后的配置才传给具体的动作处理器。

### 支持的模板语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `{{varName}}` | 简单变量名 | `{{articleId}}` |
| `{{obj.path}}` | 点号路径（取对象中的属性） | `{{query.id}}`、`{{articleDetail.author.name}}` |

### 典型场景

```
URL: ?name=张三&ref=home

onPageLoad → toast("你好 {{query.name}}！")
           → 弹窗: "你好 张三！"

点击按钮 → set-variable("greeting", "来自 {{query.ref}} 的问候")
         → 变量 greeting = "来自 home 的问候"
```

### 生效范围

所有 EventAction 类型均受益：
- `toast.message`
- `navigate.url`
- `set-variable.value`
- `call-api.url/body/headers`
- `custom-code.code`
- `confirm.content`
- `dispatch-event.eventName/detail`
- `DataSourceItem.url`
- `DataSourceItem.onSuccess[].config`
- `events.onPageLoad[].config`

### 冲突策略

| 场景 | 策略 |
|------|------|
| `initial` 和 `urlMapping` 重名 | URL "有就覆盖，无则保留" —— URL 中存在该参数则覆盖，不存在则保留 initial 的值 |
| `urlMapping.default` 与 `initial` | default 仅在 URL 无参数 **且** initial 也没有该变量时才生效 |
| `dataSources` 的执行顺序 | 严格按数组索引串行，同 `parallelGroup` 的并行执行。所有同组请求完成后才进入下一组或下一项 |
| 运行时事件动作修改变量 | 不受影响 —— 用户通过 `set-variable` 等动作修改的值在初始化完成后持续有效 |

### React 集成

`RendererProvider` 内建 `useEffect`：

```tsx
useEffect(() => {
  const variablesConfig = schema.variables;
  if (!variablesConfig) return;

  // Phase 1: 初始变量值落盘
  if (variablesConfig.initial) {
    variableStore.setMany(variablesConfig.initial);
  }

  // Phase 2: URL 参数映射
  if (variablesConfig.urlMapping?.length) {
    resolveUrlMappings(variablesConfig.urlMapping, variableStore);
  }

  // Phase 3: 页面加载事件（此时 {{query.xxx}} 已可用）
  if (variablesConfig.events?.onPageLoad?.length && actionContext) {
    executeActions(variablesConfig.events.onPageLoad, actionContext, null);
  }

  // Phase 4: API 数据源（异步）
  if (variablesConfig.dataSources?.length && actionContext) {
    executeDataSources(variablesConfig.dataSources, variableStore, actionContext);
  }
}, [schema.variables, variableStore, actionContext]);
```

### URL 参数类型转换规则

| `type` | 输入 | 输出 |
|--------|------|------|
| `"string"` (default) | `"hello"` | `"hello"` |
| `"number"` | `"42"` | `42` |
| `"boolean"` | `"true"` / `"1"` | `true` |
| `"boolean"` | `"false"` / `"0"` | `false` |
| `"array"` | `"a,b,c"` | `["a", "b", "c"]` |

## 编辑器集成

### 变量标签页新增区块

编辑器的 VariableBindingTabContent 需要新增以下配置区域：

1. **初始变量配置** —— 一个简单的键值对列表（key + value 输入框）
2. **URL 参数映射** —— 支持两种模式：
   - 单项映射：param / as / type / default 四列的表
   - 全部捕获：captureAll 勾选框，只需填 as 变量名
3. **页面加载事件** —— 选择 "页面加载" 事件，配置动作链（与 click 等事件共享同一套动作配置 UI）
4. **API 数据源** —— 列表编辑器，每项配置 url / method / assignTo / parallelGroup，支持拖拽排序
4. **页面变量列表**保持不变

## 边界场景

| 场景 | 处理 |
|------|------|
| `variables` 字段缺失或为空 | 跳过初始化，行为与当前一致 |
| `assignTo` 为空 | 该数据源被跳过（编辑器应阻止保存） |
| URL 参数解析失败（如 `?page=abc` 但 type=number） | 静默跳过该映射，不影响其余初始化 |
| `captureAll` 与单项映射同时存在 | 先执行 captureAll，再执行单项映射。单项映射可覆盖 captureAll 中的同名变量 |
| 事件动作模板变量引用不存在变量 | `{{nonexistent}}` → 空字符串，不报错 |
| action.config 中的模板变量跨多段 | `{{data.field.sub}}` 自动点号路径解析 |
| API 请求失败 | 执行 onError 动作链（如果存在），继续下一个数据源 |
| `onPageLoad` 中引用 dataSources 的结果 | 不可行——onPageLoad 在 dataSources 之前触发。改用 `DataSourceItem.onSuccess` |
| 多层嵌套的 dataSources（A 依赖 B 的结果） | 串行保证：先声明 B，再声明 A。A 的 url 中 `{{B_result.field}}` 可以引用到 B 的结果 |
| schema 热更新（编辑器预览时修改变量配置） | useEffect 重新执行，重新走初始化工序 |

## 未来扩展

| 能力 | 如何扩展 |
|------|---------|
| URL 参数自定义类型 | `UrlMappingItem.type` 新增 union 成员（如 `"json"`） |
| API 重试策略 | `DataSourceItem` 新增 `retry?: number` / `retryDelay?: number` |
| 响应数据转换 | `DataSourceItem` 新增 `transform?: string`（指定转换函数名，或配置路径映射） |
| API 缓存 | `DataSourceItem` 新增 `cache?: boolean` / `cacheTTL?: number` |
| 变量校验 | `PageVariables.initial` 的 key 支持编辑器约束（如只允许基本类型） |
| 宿主自定义数据源 | `PageVariables.extensions` 供宿主读取和自定义处理 |
| 组件内部数据共享 | 当前 DataList 的 API 数据仅在组件内部使用，后续可增加 `assignTo` prop，将数据注入 VariableStore |

## 完整示例

```json
{
  "root": {
    "id": "root",
    "type": "container",
    "props": {
      "content": "你好 {{query.name}}！当前页面: {{articleDetail.title}}"
    },
    "children": [
      {
        "id": "btn1",
        "type": "button",
        "props": { "text": "显示参数" },
        "events": [
          {
            "event": "click",
            "actions": [
              {
                "id": "a1",
                "type": "toast",
                "config": {
                  "type": "info",
                  "message": "URL: {{query.ref}}"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "variables": {
    "initial": {
      "pageTitle": "默认标题"
    },
    "urlMapping": [
      { "as": "query", "captureAll": true }
    ],
    "events": {
      "onPageLoad": [
        { "id": "e1", "type": "toast", "config": { "type": "success", "message": "欢迎 {{query.name}}！" } }
      ]
    },
    "dataSources": [
      {
        "name": "文章详情",
        "url": "/api/article/{{query.id}}",
        "assignTo": "articleDetail"
      }
    ]
  }
}
```

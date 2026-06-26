# 低代码组件通信机制

## 架构概览

`page-schema` 引擎通过 **事件绑定 + 变量系统 + 条件中间件** 实现组件间通信，核心设计原则是 **纯 JSON 可序列化**（不依赖函数引用，可持久化到数据库）。

```
┌─────────────────────────────────────────────────────────────────┐
│                     RendererProvider                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ ActionContext │  │  EventBus    │  │  VariableCapability   │ │
│  │ (IoC 注入)   │  │ (pub/sub)    │  │  (pageVars 存储)      │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
│         │                 │                       │             │
│  ┌──────▼─────────────────▼───────────────────────▼───────────┐ │
│  │                   Middleware Chain                          │ │
│  │  event-handler → condition → variable-parser → style ...   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SchemaNode Tree                          │ │
│  │                                                            │ │
│  │   Button A                         Section B               │ │
│  │   ┌─────────────────┐              ┌─────────────────┐    │ │
│  │   │ events: [       │              │ props: {        │    │ │
│  │   │   { event:      │   set-var    │   show: true,   │    │ │
│  │   │     "click",    │ ──────────►  │   condition: {  │    │ │
│  │   │     actions: [  │              │     field:      │    │ │
│  │   │       set-var,  │              │     "isVisible",│    │ │
│  │   │       dispatch  │              │     operator:   │    │ │
│  │   │     ]           │              │     "eq",       │    │ │
│  │   │   }             │              │     value: true │    │ │
│  │   │ ]               │              │   }             │    │ │
│  │   └─────────────────┘              └─────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 通信模式一：A 组件控制 B 组件的显示/隐藏

### 方案 1：`set-variable` + `condition` 中间件（推荐）

**原理**：A 组件点击后设置变量 → B 组件的 `condition` 中间件读取变量 → 决定是否渲染。

**Schema 示例**：

```json
{
  "root": {
    "id": "root",
    "type": "container",
    "children": [
      {
        "id": "btn-toggle",
        "type": "button",
        "props": { "text": "切换面板显示" },
        "events": [
          {
            "event": "click",
            "actions": [
              {
                "id": "action-1",
                "type": "set-variable",
                "config": {
                  "key": "isPanelVisible",
                  "value": true
                }
              }
            ]
          }
        ]
      },
      {
        "id": "hidden-panel",
        "type": "section",
        "props": {
          "condition": {
            "field": "isPanelVisible",
            "operator": "eq",
            "value": true
          }
        },
        "children": [
          {
            "id": "panel-text",
            "type": "text",
            "props": { "content": "这个面板由按钮控制显示！" }
          }
        ]
      }
    ]
  }
}
```

**运行时集成**（宿主应用需要提供 condition 中间件）：

> **重要**：为了让 `set-variable` 动作修改的变量能被 condition 中间件实时读取，
> 需要使用 **动态中间件**（`createDynamicConditionMiddleware`），并共享同一个变量存储。

```tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { message } from 'antd';
import {
  RendererProvider,
  PageRenderer,
  createDynamicConditionMiddleware,
  createDynamicVariableParserMiddleware,
  styleInjector,
} from '@abner-blog/page-schema';
import type { ActionContext, SchemaNode, ModalApi } from '@abner-blog/page-schema';

const PageWithCondition = ({ schema }) => {
  const modalApiRef = useRef<ModalApi>({ open: () => {}, close: () => {} });

  // 1. 创建共享的变量存储（普通对象，非 React state）
  //    - actionContext.variables 的 set/get 操作这个对象
  //    - 动态中间件在每次渲染时从这个对象读取最新值
  const pageVars = useRef<Record<string, unknown>>({});

  // 2. 创建动态中间件：每次渲染时读取最新变量
  const conditionMiddleware = useMemo(
    () => createDynamicConditionMiddleware(() => pageVars.current),
    [],
  );
  const variableParser = useMemo(
    () => createDynamicVariableParserMiddleware(() => pageVars.current),
    [],
  );

  // 3. actionContext 工厂：变量操作指向同一个 pageVars
  const actionContextFactory = useCallback(
    (rootNode: SchemaNode): ActionContext => ({
      sourceNode: rootNode,
      toast: {
        success: (msg) => message.success(msg),
        error: (msg) => message.error(msg),
        info: (msg) => message.info(msg),
        warning: (msg) => message.warning(msg),
      },
      navigate: (url, target = '_self') => {
        if (target === '_blank') window.open(url, '_blank');
        else window.location.href = url;
      },
      modals: {
        open: (id, data) => modalApiRef.current.open(id, data),
        close: (id) => modalApiRef.current.close(id),
      },
      variables: {
        get: (key) => pageVars.current[key],
        set: (key, value) => { pageVars.current[key] = value; },
        delete: (key) => { delete pageVars.current[key]; },
        clear: () => { Object.keys(pageVars.current).forEach(k => delete pageVars.current[k]); },
      },
      eventBus: {
        emit: (name, detail) => { /* ... */ },
        on: (name, handler) => { /* ... */ return () => {}; },
      },
      getRootNode: () => rootNode,
    }),
    [],
  );

  return (
    <RendererProvider
      schema={schema}
      extraMiddlewares={[styleInjector, conditionMiddleware, variableParser]}
      actionContextFactory={actionContextFactory}
    >
      <PageRenderer schema={schema} />
    </RendererProvider>
  );
};
```

**数据流**：
```
用户点击按钮
    │
    ▼
set-variable 动作执行
    │
    ▼
pageVars.current[key] = value  ← 写入共享存储
    │
    ▼
React 重渲染（状态变化触发）
    │
    ▼
condition 中间件执行
    │
    ▼
getContext() → pageVars.current  ← 读取最新值
    │
    ▼
evaluateCondition(condition, context)
    │
    ▼
条件满足 → 渲染组件 / 条件不满足 → 返回 null
```

### 方案 2：`dispatch-event` + `window.addEventListener`

**原理**：A 组件派发自定义事件 → B 组件监听该事件 → 更新自身状态。

**Schema 示例**：

```json
{
  "events": [
    {
      "event": "click",
      "actions": [
        {
          "id": "dispatch-1",
          "type": "dispatch-event",
          "config": {
            "eventName": "toggle-panel",
            "detail": { "visible": true }
          }
        }
      ]
    }
  ]
}
```

**外部监听**：

```tsx
useEffect(() => {
  const handler = (e: CustomEvent) => {
    setPanelVisible(e.detail.visible);
  };
  window.addEventListener('toggle-panel', handler);
  return () => window.removeEventListener('toggle-panel', handler);
}, []);
```

### 方案 3：`open-modal` / `close-modal`（弹窗场景）

**原理**：专门用于 Modal 组件的显示/隐藏控制。

**Schema 示例**：

```json
{
  "events": [
    {
      "event": "click",
      "actions": [
        {
          "id": "open-1",
          "type": "open-modal",
          "config": {
            "modalId": "confirm-modal",
            "data": { "itemId": "123" }
          }
        }
      ]
    }
  ]
}
```

---

## 通信模式二：B 组件展示 A 组件的计算结果

### 方案 1：`set-variable` + 模板变量 `{{key}}`

**原理**：A 组件计算后将结果存入变量 → B 组件通过 `{{key}}` 模板语法读取并展示。

**Schema 示例**：

```json
{
  "root": {
    "id": "root",
    "type": "container",
    "children": [
      {
        "id": "input-a",
        "type": "form-input",
        "props": { "name": "num1", "label": "数字 A" },
        "events": [
          {
            "event": "change",
            "actions": [
              {
                "id": "calc-1",
                "type": "custom-code",
                "config": {
                  "code": "const a = parseFloat(event.target.value) || 0; const b = parseFloat(context.variables.get('num2')) || 0; context.variables.set('sum', a + b);"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "input-b",
        "type": "form-input",
        "props": { "name": "num2", "label": "数字 B" },
        "events": [
          {
            "event": "change",
            "actions": [
              {
                "id": "calc-2",
                "type": "custom-code",
                "config": {
                  "code": "const b = parseFloat(event.target.value) || 0; const a = parseFloat(context.variables.get('num1')) || 0; context.variables.set('sum', a + b);"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "result-display",
        "type": "text",
        "props": {
          "content": "计算结果：{{sum}}"
        }
      }
    ]
  }
}
```

### 方案 2：`call-api` + `assignTo` + 模板变量

**原理**：A 组件触发 API 调用 → 结果存入变量 → B 组件展示。

**Schema 示例**：

```json
{
  "events": [
    {
      "event": "click",
      "actions": [
        {
          "id": "fetch-1",
          "type": "call-api",
          "config": {
            "url": "/api/weather",
            "method": "GET",
            "assignTo": "weatherData",
            "onSuccess": [
              {
                "id": "toast-1",
                "type": "toast",
                "config": { "type": "success", "message": "数据已更新" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

```json
{
  "id": "weather-display",
  "type": "text",
  "props": {
    "content": "当前温度：{{weatherData.temperature}}°C"
  }
}
```

---

## 通信模式三：`dispatch-event` + `EventBus`（高级场景）

**原理**：通过 EventBus 实现组件间解耦通信，支持复杂的发布/订阅模式。

**Schema 示例**：

```json
{
  "id": "sender",
  "type": "button",
  "props": { "text": "发送数据" },
  "events": [
    {
      "event": "click",
      "actions": [
        {
          "id": "dispatch-1",
          "type": "dispatch-event",
          "config": {
            "eventName": "data-ready",
            "detail": { "items": [1, 2, 3], "count": 3 }
          }
        }
      ]
    }
  ]
}
```

**接收端**（需要自定义组件或 custom-code 监听）：

```json
{
  "id": "receiver",
  "type": "html-embed",
  "props": {
    "html": "<div id='receiver-output'></div>"
  },
  "events": [
    {
      "event": "mount",
      "actions": [
        {
          "id": "listen-1",
          "type": "custom-code",
          "config": {
            "code": "context.eventBus.on('data-ready', (detail) => { document.getElementById('receiver-output').textContent = '收到 ' + detail.count + ' 条数据'; });"
          }
        }
      ]
    }
  ]
}
```

---

## 支持的条件运算符

`condition` 中间件支持以下运算符：

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `eq` | 等于 | `{ "field": "role", "operator": "eq", "value": "admin" }` |
| `neq` | 不等于 | `{ "field": "role", "operator": "neq", "value": "guest" }` |
| `gt` | 大于 | `{ "field": "count", "operator": "gt", "value": 10 }` |
| `lt` | 小于 | `{ "field": "count", "operator": "lt", "value": 100 }` |
| `gte` | 大于等于 | `{ "field": "score", "operator": "gte", "value": 60 }` |
| `lte` | 小于等于 | `{ "field": "score", "operator": "lte", "value": 100 }` |
| `contains` | 包含 | `{ "field": "name", "operator": "contains", "value": "张" }` |
| `notContains` | 不包含 | `{ "field": "email", "operator": "notContains", "value": "test" }` |
| `in` | 在数组中 | `{ "field": "status", "operator": "in", "value": ["active", "pending"] }` |
| `notIn` | 不在数组中 | `{ "field": "role", "operator": "notIn", "value": ["banned"] }` |

---

## 支持的动作类型

| 动作类型 | 说明 | 配置项 |
|----------|------|--------|
| `toast` | 消息提示 | `type`, `message`, `duration` |
| `navigate` | 页面跳转 | `url`, `target`, `params` |
| `open-modal` | 打开弹窗 | `modalId`, `data` |
| `close-modal` | 关闭弹窗 | `modalId` |
| `confirm` | 确认对话框 | `title`, `content`, `onConfirm[]`, `onCancel[]` |
| `set-variable` | 设置变量 | `key`, `value`, `scope` |
| `call-api` | API 调用 | `url`, `method`, `body`, `assignTo`, `onSuccess[]`, `onError[]` |
| `dispatch-event` | 派发自定义事件 | `eventName`, `detail` |
| `scroll-to` | 滚动到元素 | `selector`, `behavior` |
| `custom-code` | 自定义代码 | `code`, `contextVars[]` |
| `reload` | 刷新页面 | - |
| `back` | 返回上一页 | - |

---

## 变量作用域

| 作用域 | 说明 | 存储位置 |
|--------|------|----------|
| `page` | 页面级变量（默认） | `ActionContext.variables`（内存） |
| `global` | 全局变量（跨页面） | `window.__pageSchemaVars` |
| `local` | 局部变量（预留） | 暂未实现 |

---

## 数据流总结

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互                                  │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                           │
│                   │  DOM Event      │                           │
│                   │  (click/change) │                           │
│                   └────────┬────────┘                           │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                           │
│                   │ EventHandler    │                           │
│                   │ Middleware      │                           │
│                   └────────┬────────┘                           │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                           │
│                   │ executeActions  │ (串行执行动作链)            │
│                   └────────┬────────┘                           │
│                            │                                    │
│              ┌─────────────┼─────────────┐                      │
│              ▼             ▼             ▼                      │
│     ┌──────────────┐ ┌──────────┐ ┌──────────────┐             │
│     │ set-variable │ │ dispatch │ │ call-api     │             │
│     │ (写变量)     │ │ -event   │ │ (HTTP +      │             │
│     │              │ │ (事件总  │ │  assignTo)   │             │
│     │              │ │  线)     │ │              │             │
│     └──────┬───────┘ └────┬─────┘ └──────┬───────┘             │
│            │              │              │                      │
│            ▼              ▼              ▼                      │
│     ┌──────────────────────────────────────────┐               │
│     │         VariableCapability               │               │
│     │         (pageVars / window)              │               │
│     └─────────────────────┬────────────────────┘               │
│                           │                                     │
│                           ▼                                     │
│     ┌──────────────────────────────────────────┐               │
│     │      Condition / VariableParser          │               │
│     │      Middleware (渲染时求值)              │               │
│     └─────────────────────┬────────────────────┘               │
│                           │                                     │
│                           ▼                                     │
│     ┌──────────────────────────────────────────┐               │
│     │         B 组件渲染                        │               │
│     │         (显示/隐藏/动态内容)              │               │
│     └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 完整示例：计算器组件

以下是一个完整的计算器示例，展示 A 组件（输入框）控制 B 组件（结果展示）的显示和内容：

```json
{
  "root": {
    "id": "calculator",
    "type": "container",
    "props": { "style": { "padding": "24px", "maxWidth": "400px" } },
    "children": [
      {
        "id": "title",
        "type": "text",
        "props": { "content": "简易计算器", "as": "h2" }
      },
      {
        "id": "num1-input",
        "type": "form-input",
        "props": { "name": "num1", "label": "数字 A", "type": "number" },
        "events": [
          {
            "event": "change",
            "actions": [
              {
                "id": "set-num1",
                "type": "set-variable",
                "config": { "key": "num1", "value": "{{event.target.value}}" }
              }
            ]
          }
        ]
      },
      {
        "id": "num2-input",
        "type": "form-input",
        "props": { "name": "num2", "label": "数字 B", "type": "number" },
        "events": [
          {
            "event": "change",
            "actions": [
              {
                "id": "set-num2",
                "type": "set-variable",
                "config": { "key": "num2", "value": "{{event.target.value}}" }
              },
              {
                "id": "calc",
                "type": "custom-code",
                "config": {
                  "code": "const a = parseFloat(context.variables.get('num1')) || 0; const b = parseFloat(event.target.value) || 0; context.variables.set('sum', a + b); context.variables.set('product', a * b); context.variables.set('hasResult', true);"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "result-section",
        "type": "section",
        "props": {
          "condition": {
            "field": "hasResult",
            "operator": "eq",
            "value": true
          }
        },
        "children": [
          {
            "id": "sum-display",
            "type": "text",
            "props": { "content": "求和结果：{{sum}}" }
          },
          {
            "id": "product-display",
            "type": "text",
            "props": { "content": "乘积结果：{{product}}" }
          }
        ]
      },
      {
        "id": "reset-btn",
        "type": "button",
        "props": { "text": "重置" },
        "events": [
          {
            "event": "click",
            "actions": [
              {
                "id": "clear-vars",
                "type": "custom-code",
                "config": {
                  "code": "context.variables.clear(); context.variables.set('hasResult', false);"
                }
              },
              {
                "id": "toast",
                "type": "toast",
                "config": { "type": "info", "message": "已重置" }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 编辑器中的配置流程

在 GrapesJS 编辑器中配置组件间通信：

1. **选中组件** → 右侧面板出现「事件绑定」标签
2. **添加事件** → 选择触发事件（click/change/focus 等）
3. **添加动作** → 选择动作类型（set-variable/dispatch-event 等）
4. **配置参数** → 填写变量名、值、条件等
5. **保存** → 配置写入 `data-events` 属性 → 转换为 `SchemaNode.events`

```
编辑器组件 DOM
    │
    ▼
data-events 属性 (JSON 字符串)
    │
    ▼
schemaConverter 提取
    │
    ▼
SchemaNode.events[]
    │
    ▼
EventHandler 中间件绑定 DOM 监听
    │
    ▼
executeActions 执行动作链
```

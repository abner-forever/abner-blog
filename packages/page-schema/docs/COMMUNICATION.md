# 低代码平台组件间通信机制详解

> 本文档详细说明 @abner-blog/page-schema 包中低代码页面运行时组件间的通信架构。
> 涵盖**变量系统、事件系统、中间件系统、范围上下文、事件总线**五条通信链路，适合面试准备和技术学习。

---

## 目录

1. [架构概览](#1-架构概览)
2. [通信链路一：变量系统（状态共享）](#2-通信链路一变量系统状态共享)
3. [通信链路二：事件系统（行为触发）](#3-通信链路二事件系统行为触发)
4. [通信链路三：中间件系统（渲染管道）](#4-通信链路三中间件系统渲染管道)
5. [通信链路四：范围上下文通信（React Context）](#5-通信链路四范围上下文通信react-context)
6. [通信链路五：事件总线（EventBus）](#6-通信链路五事件总线eventbus)
7. [五条链路如何协作](#7-五条链路如何协作)
8. [数据流全景：一个完整的互动流程](#8-数据流全景一个完整的互动流程)
9. [架构演进：从全量渲染到精准订阅](#9-架构演进从全量渲染到精准订阅)
10. [面试常见问题](#10-面试常见问题)

---

## 1. 架构概览

低代码平台的组件树由 JSON Schema（`SchemaNode` 树）描述，运行时渲染引擎（`PageRenderer`）递归遍历节点树并渲染为真实 DOM。组件之间的通信不通过 React Props 传递（因为 Schema 是静态 JSON），而是通过三种机制协同实现：

```
┌────────────────────────────────────────────────────────────────────┐
│                      低代码页面运行时架构                            │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    RendererProvider                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │  │
│  │  │Component │  │Middleware│  │Variable  │  │  Action      │ │  │
│  │  │Registry  │  │   Chain  │  │Store     │  │  Context     │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  五条通信链路：                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ① 变量系统 (VariableStore)       读: 中间件 写: 事件动作    │  │
│  │ ② 事件系统 (EventHandler)         用户操作 → 执行动作链     │  │
│  │ ③ 中间件系统 (Middleware Chain)   渲染时注入变量和事件       │  │
│  │ ④ 范围上下文 (React Context)      父子作用域内状态共享      │  │
│  │ ⑤ 事件总线 (EventBus)            信号通知, 解耦通信        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

| 通信方式 | 方向 | 使用场景 | 技术实现 |
|---------|------|---------|---------|
| **① 变量系统** | 组件 A → 组件 B（数据共享） | 表单输入 → 文本展示、条件显隐 | `VariableStore` + `useSyncExternalStore` |
| **② 事件系统** | 用户交互 → 任意组件 | 点击按钮 → 弹窗、跳转、设置变量 | `EventListener` + `ActionChain` |
| **③ 中间件系统** | 渲染管道注入（横向） | 样式注入、事件绑定、变量替换 | `Middleware( node, next ) => ReactNode` |
| **④ 范围上下文** | 父容器 → 子组件（父子范围） | 表单容器管理字段值、弹窗状态管理 | `React.createContext` + `useContext` |
| **⑤ 事件总线** | 任意组件 → 任意组件（解耦） | 组件间自定义事件、与宿主系统通信 | `eventBus.emit/on` + `window.CustomEvent` |

---

## 2. 通信链路一：变量系统（状态共享）

### 2.1 设计目标

两个不同的 SchemaNode 组件（例如表单输入框和文本显示组件）需要共享数据。因为 Schema 是静态 JSON，不可能像普通 React 那样通过 `props` 或 `Context` 传递状态。

### 2.2 VariableStore 核心实现

`VariableStore` 是一个**可观察的状态容器**，核心代码位于 `variable-store.ts`：

```typescript
// 简化的核心逻辑
class VariableStore {
  private state: Record<string, unknown> = {};
  private keySubs = new Map<string, Set<StoreListener>>();  // 按 key 订阅
  private allSubs = new Set<StoreListener>();               // 全局兜底订阅

  get(key: string): unknown {
    return this.state[key];
  }

  set(key: string, value: unknown): void {
    this.state[key] = value;
    // 通知该 key 的订阅者 + 全局订阅者
    this.keySubs.get(key)?.forEach((cb) => cb());
    this.allSubs.forEach((cb) => cb());
  }

  // 订阅某个特定变量的变化
  subscribeKey(key: string, listener: () => void): () => void {
    // ...返回取消订阅函数
  }

  // 生成快照供 React 对比
  makeSnapshot(keys: string[]): string {
    return JSON.stringify(/* 只包含 keys 中的值 */);
  }
}
```

关键设计点：

> **为什么要用 `subscribeKey` + `subscribeAll` 双层订阅？**
>
> `subscribeKey` 实现按需精准更新，`subscribeAll` 作为兜底——当某个组件依赖的变量通过 `extractNodeVariableDeps` 未能准确提取时，全局订阅确保它仍然能收到更新。这在调试和复杂场景下保障了正确性。

### 2.3 React 集成：useSyncExternalStore

每个 `RenderNode` 在渲染时通过 `useSyncExternalStore` 订阅它依赖的变量：

```typescript
// renderer.tsx - RenderNode 组件
function RenderNode({ node, depth }) {
  // 1. 提取依赖：扫描 node.props 中的 {{key}} 和 condition.field
  const varDeps = useMemo(() => extractNodeVariableDeps(node.props), [node]);

  // 2. 订阅这些变量，只订阅自己需要的
  const varSnapshot = useVariableSubscription(varDeps);

  // 3. 缓存中间件结果，仅 snapshot 变化时重执行
  const memoKey = `${node.id}_${depth}_${varSnapshot}`;
  const middlewareResult = useMemo(
    () => applyMiddlewares(node, allMiddlewares, renderComponent),
    [memoKey, node, allMiddlewares],
  );

  return middlewareResult;
}
```

`useVariableSubscription` 内部使用 `useSyncExternalStore`（React 18 API）：

```typescript
function useVariableSubscription(deps: string[]): string {
  const store = useContext(VariableContext);
  if (!store) return '';

  return useSyncExternalStore(
    // subscribe: 注册变量变化的监听
    (onStoreChange) => {
      if (deps.length === 0) return () => {};
      const unsubs = deps.map(key => store.subscribeKey(key, onStoreChange));
      const unsubAll = store.subscribeAll(onStoreChange);
      return () => { unsubs.forEach(fn => fn()); unsubAll(); };
    },
    // getSnapshot: 生成快照供 Object.is 比较
    () => store.makeSnapshot(deps),
  );
}
```

### 2.4 变量如何被写入

变量通过两种方式写入：

**方式一：事件动作 `set-variable`**

用户在一个组件上配置事件 → 选择 `set-variable` 动作 → 设置 key 和 value。触发后在 `setVariableAction` 处理器中调用：

```typescript
// built-in-actions/set-variable.ts
context.variables.set(config.key, config.value);
```

`context.variables` 在 `RendererProvider` 中从 `VariableStore` 注入：

```typescript
// provider.tsx - RendererProvider
const actionContext = {
  ...hostCtx,
  variables: {
    get: (key) => variableStore.get(key),
    set: (key, value) => { variableStore.set(key, value); },
    delete: (key) => { variableStore.delete(key); },
    clear: () => { variableStore.clear(); },
  },
};
```

**方式二：`call-api` 动作的 `assignTo`**

API 调用的返回结果可以自动赋值给变量：

```typescript
context.variables.set(config.assignTo, responseData);
```

### 2.5 变量如何在渲染时被读取

变量在渲染时通过两个中间件读取：

**（a）变量解析中间件** (`variable-parser.ts`)

替换 `props` 中的 `{{variableName}}` 模板语法：

```less
// Schema 中定义：
{ "content": "欢迎，{{username}}！" }

// 运行时（variable-parser 中间件）：
"欢迎，张三！"    // ← 从 VariableStore 读取 username 替换
```

**（b）条件求值中间件** (`condition.ts`)

控制组件的显隐：

```json
// Schema 中定义：
{
  "condition": {
    "field": "userRole",
    "operator": "eq",
    "value": "admin"
  }
}

// 运行时：如果 VariableStore 中 userRole !== "admin"，返回 null 跳过渲染
```

### 2.6 变量依赖如何提取

`extractNodeVariableDeps` 自动扫描节点的变量依赖：

```typescript
function extractNodeVariableDeps(props: Record<string, unknown>): string[] {
  const deps = new Set<string>();

  // 1. 扫描 props 中的 {{key}} 模板
  for (const value of Object.values(props)) {
    if (typeof value === 'string') {
      const matches = value.match(VARIABLE_REGEX);  // /\{\{([^}]+)\}\}/g
      if (matches) {
        matches.forEach(match => {
          const key = match.slice(2, -2).trim();
          if (key) deps.add(key);
        });
      }
    }
  }

  // 2. 检查 condition.field
  const condition = props.condition as { field?: string } | undefined;
  if (condition?.field) deps.add(condition.field);

  return [...deps];
}
```

> 如果条件表达式中引用了变量但没有用 `{{}}` 语法，该变量不会被提取为依赖。这种情况需要全局订阅（`subscribeAll`）兜底。

---

## 3. 通信链路二：事件系统（行为触发）

### 3.1 设计哲学

事件系统是低代码平台中**用户交互触发组件行为**的通道。核心思想是**将事件绑定描述为 JSON 可序列化的数据结构**（而非函数引用），这样可以持久化到数据库、在编辑器中可视化配置。

### 3.2 数据结构

```typescript
// 节点上存储的事件绑定
interface EventBinding {
  event: string;       // DOM 事件名: click | change | mouseenter | ...
  actions: EventAction[];  // 动作列表（按顺序串行执行）
  debounce?: number;   // 防抖延迟(ms)
  throttle?: number;   // 节流延迟(ms)
  condition?: string;  // 运行时条件表达式
}

// 单个动作
interface EventAction {
  id: string;
  type: EventActionType;  // 12 种内置动作类型
  label?: string;
  config: Record<string, unknown>;  // 动作参数
}

// 12 种动作类型
type EventActionType =
  | 'toast'          // 消息提示
  | 'navigate'       // 页面跳转
  | 'open-modal'     // 打开弹窗
  | 'close-modal'    // 关闭弹窗
  | 'confirm'        // 确认对话框
  | 'set-variable'   // 设置变量（核心！跨组件通信的关键）
  | 'call-api'       // 调用 API
  | 'dispatch-event' // 自定义事件
  | 'reload'         // 刷新页面
  | 'back'           // 返回
  | 'scroll-to'      // 滚动到指定元素
  | 'custom-code'    // 执行自定义 JS 代码
```

### 3.3 事件绑定的注入方式

事件中间件（`event-handler.ts`）通过**包装一层 DOM 容器**来绑定事件：

```
渲染结果结构（简化）：
<RendererProvider>
  <EventHandlerWrapper events={[...]}>    ← 中间件注入的事件包装
    <ComponentRenderer>                   ← 实际组件
      子组件...
    </ComponentRenderer>
  </EventHandlerWrapper>
</RendererProvider>
```

`EventHandlerWrapper` 使用 `display: contents` 的 span 包裹（不破坏布局），在 `useEffect` 中用原生 `addEventListener` 绑定事件：

```typescript
// event-handler.tsx - EventHandlerWrapper 简化
const EventHandlerWrapper = ({ events, context, children }) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    // 为 events 中的每个绑定添加原生 DOM 事件监听
    events.forEach(binding => {
      const handler = createBindingHandler(binding, context);
      wrapper.addEventListener(binding.event, handler, true);  // 捕获阶段
    });
    return () => { /* 清理 */ };
  }, [events, context]);

  return <span ref={wrapperRef} style={{ display: 'contents' }}>{children}</span>;
};
```

> 为什么用原生 DOM 事件而不是 React 合成事件？
> React 合成事件有冒泡和委托的问题（特别是在弹窗 Portal 中），原生事件更可靠。对于 `change` 事件还额外监听了 `input` 事件以实现实时更新。

### 3.4 动作执行引擎

动作链通过 `executor.ts` 串行执行：

```typescript
async function executeActions(
  actions: EventAction[],
  context: ActionContext,
  event: Event,
) {
  for (const action of actions) {
    const handler = actionRegistry.get(action.type);
    if (!handler) continue;  // 容错：未注册的动作跳过

    try {
      await handler(action, context, event);
    } catch (err) {
      console.error(`动作执行失败: ${action.type}`, err);
      // 单个动作失败不影响后续动作
    }
  }
}
```

`ActionRegistry` 全局注册表管理所有动作处理器，支持运行时扩展：

```typescript
const actionRegistry = new ActionRegistry();

// 内置动作在初始化时注册
registerBuiltInActions();

// 宿主应用可以注册自定义动作
actionRegistry.register('my-custom-action', myHandler);
```

### 3.5 set-variable 动作详解

这是**变量系统**和**事件系统**的桥梁：

```typescript
// set-variable.ts
export const setVariableAction: ActionHandler = (action, context) => {
  const config = action.config;

  switch (config.scope ?? 'page') {
    case 'page':
      // 写入 VariableStore → 触发订阅者的重新渲染
      context.variables.set(config.key, config.value);
      break;
    case 'global':
      // 跨页面共享（挂载到 window.__pageSchemaVars）
      break;
    case 'local':
      // 暂不支持
      break;
  }
};
```

> 这一步是**整个跨组件通信的核心**：组件 A 的点击事件通过 `set-variable` 写入变量，组件 B 因为依赖该变量（通过 `useVariableSubscription` 订阅）而自动重新渲染。

---

## 4. 通信链路三：中间件系统（渲染管道）

### 4.1 中间件模式

中间件系统采用经典的**洋葱模型**（类似 Koa），每个中间件可以选择修改节点、跳过渲染或透传：

```typescript
type Middleware = (
  node: SchemaNode,
  next: (node: SchemaNode) => React.ReactNode,
) => React.ReactNode;
```

### 4.2 中间件链的组合

```typescript
// 中间件链的构建
const middlewares = [
  eventHandler,          // ① 事件绑定（最外层）
  styleInjector,         // ② 样式注入
  conditionMiddleware,   // ③ 条件求值
  variableParser,        // ④ 变量解析（最内层，靠近组件）
];

// 在 RendererProvider 中组合（使用 reduceRight，让数组顺序从左到右执行）
let composed = identity;
for (let i = middlewares.length - 1; i >= 0; i--) {
  composed = (n) => middlewares[i](n, composed);
}
return composed(node);
```

### 4.3 中间件优先级与数据流

中间件的执行顺序决定了变量注入 / 条件判断 / 事件绑定的先后关系：

```
执行顺序（从左到右）：
eventHandler → styleInjector → conditionMiddleware → variableParser → Component

对于事件绑定的节点，渲染结果：
<span style="display:contents">        ← eventHandler 包装
  <div style="color:red">              ← styleInjector 注入样式
    {condition ? (                      ← conditionMiddleware 判断
      <Component                        ← 实际组件
        content="欢迎，张三！"            ← variableParser 替换 {{username}}
      />
    ) : null}
  </div>
</span>
```

### 4.4 静态中间件 vs 动态中间件

每个中间件都有两种变体：

| 变体 | 变量来源 | 适用场景 |
|------|---------|---------|
| `createConditionMiddleware(fixedContext)` | 固定对象 | 变量不会变化的场景 |
| `createDynamicConditionMiddleware(getContext)` | 每次调用从 getter 获取 | 需要响应变量变化的场景 |
| `createVariableParserMiddleware(fixedVars)` | 固定对象 | 静态模板替换 |
| `createDynamicVariableParserMiddleware(getVars)` | 每次调用从 getter 获取 | 动态变量联动 |

动态中间件从 `variableStore.getAll()` 读取最新变量值：

```typescript
// PageDetail.tsx / PagePreview.tsx
const variableStore = useMemo(() => new VariableStore(), []);

const conditionMiddleware = createDynamicConditionMiddleware(
  () => variableStore.getAll()
);

const variableParserMiddleware = createDynamicVariableParserMiddleware(
  () => variableStore.getAll()
);
```

---

## 5. 通信链路四：范围上下文通信（React Context）

### 5.1 设计动机

前面的变量系统（VariableStore）是**全局按 key 发布订阅**，但有些场景需要**父子作用域的通信**——即只有某个容器的后代组件才能访问该容器的状态。这时候用 VariableStore 需要全局保证 key 不冲突，过于笨重。

React Context 天然的"范围性"恰好满足：
- **Form 容器 + 表单字段**：值在 Form 内共享，不影响其他 Form
- **Modal + 弹窗内容**：弹窗可见性由 ModalProvider 管理

### 5.2 FormContext — 表单父子通信

```
作用域：
<Form>                               ← FormContext.Provider
  ├── <FormInput name="email" />     ← useFormContext() 读取/写入值
  ├── <FormSelect name="role" />     ← useFormContext() 读取/写入值
  ├── <FormCheckbox name="agree" />  ← useFormContext() 读取/写入值
  └── <FormSubmit />                 ← useFormContext() 触发提交

另一个独立的 Form：
<Form>                               ← 全新的 FormContext，互不干扰
  └── <FormInput name="email" />     ← 读取的是第二个 Form 的值
</Form>
```

**核心机制**（`Form.tsx`）：

```typescript
// Form 容器创建 FormContext
const FormContext = createContext<FormContextValue | null>(null);

function Form({ node, children }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const formContextValue = {
    values,
    setValue: (name, value) => setValues(prev => ({ ...prev, [name]: value })),
    register: (field) => { /* 注册字段 */ },
    errors,
    submit: async () => { /* 校验 → 提交 */ },
  };

  return (
    <FormContext.Provider value={formContextValue}>
      {children}
    </FormContext.Provider>
  );
}

// 子组件通过 useFormContext 接入
function FormInput({ node }) {
  const formCtx = useFormContext();  // <-- 关键：读父 Form 的 Context

  // 有 FormContext 时用 Context 的值，否则独立管理内部状态
  const value = formCtx ? formCtx.values[name] : internalValue;

  const handleChange = (e) => {
    if (formCtx) {
      formCtx.setValue(name, e.target.value);  // 写入父 Form 的状态
    }
  };
}
```

### 5.3 双模式适配（独立使用 vs Form 内使用）

所有表单字段组件（FormInput、FormTextarea、FormSelect、FormCheckbox）都支持**双模式**：

```typescript
// FormInput.tsx
function FormInput({ node }) {
  const formCtx = useFormContext();  // 可能为 null

  // 有 FormContext → 使用父 Form 的值
  // 无 FormContext → 使用内部 state
  const value = formCtx
    ? (formCtx.values[name] as string) ?? ''
    : internalValue;

  // 当 props.value 变化时（变量绑定更新），同步到内部状态
  useEffect(() => {
    if (propValue !== undefined && !formCtx) {
      setInternalValue(propValue);
    }
  }, [propValue, formCtx]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (formCtx) {
      formCtx.setValue(name, newValue);    // → 通知同 Form 的其他字段
    } else {
      setInternalValue(newValue);           // → 独立状态管理
    }
  };
}
```

### 5.4 与 VariableStore 对比

| 对比维度 | VariableStore | React Context (FormContext) |
|---------|--------------|---------------------------|
| **作用域** | 全局（整个页面共享） | 范围（限定在 Provider 子树内） |
| **实现** | 发布订阅 + `useSyncExternalStore` | React 原生 `createContext` |
| **粒度** | 按 key 订阅，精准重渲染 | 所有子组件共享同一份 values |
| **生命周期** | 与页面共存 | 与 Form 容器共存 |
| **适用场景** | 跨组件、跨层次的任意通信 | 父子容器的范围状态管理 |
| **多个实例** | key 需要手动区分（如 `form1_email`） | 天然隔离，互不干扰 |

### 5.5 ModalContext — 弹窗管理通信

Modal 的通信分两个层面：

**层面一：触发组件 → 打开/关闭弹窗**

通过事件动作实现，走的是**事件系统 + ModalContext**：

```typescript
// Schema 配置：
{
  "event": "click",
  "actions": [{
    "type": "open-modal",
    "config": { "modalId": "confirm-modal" }
  }]
}

// 执行时：
// 事件系统 → openModalAction → context.modals.open(modalId, data)
// → ModalProvider.openModal(modalId) → 更新 modalStates
```

**层面二：Modal 内部组件读取弹窗状态**

通过 `ModalContext`（`provider.tsx`）：

```typescript
// ModalProvider 提供：
interface ModalContextValue {
  openModal: (modalId, data?) => void;
  closeModal: (modalId) => void;
  modalNodes: SchemaNode[];
  isModalVisible: (modalId) => boolean;
}

// ModalPortals 渲染弹窗内容：
// 弹窗通过 Portal 渲染到 document.body（脱离 DOM 树）
// 但 Portal 不打断 React Context 链
// → ModalChildNode 仍然能访问 RendererContext + ModalContext
// → ModalChildNode 也使用 useVariableSubscription 订阅变量
```

关键设计点：Portal 会打断 DOM 层级，但 **不会打断 React Context 链**。因此即使 Modal 内容渲染在 `document.body` 下，仍然能完整使用中间件系统和变量系统。

---

## 6. 通信链路五：事件总线（EventBus）

### 6.1 设计动机

变量系统（VariableStore）是**状态驱动的通信**——数据变化驱动 UI 更新。但有的时候，组件之间只需要**通知一个事件发生了**，而不需要传递或共享状态。例如：
- 组件 A 完成某个操作后通知组件 B "可以刷新了"
- 自定义组件需要和宿主系统（非页面 Schema 内的代码）通信

**事件总线**提供的是**信号驱动的通信**——只需通知"发生了什么"，不关心谁在监听。

### 6.2 双层事件派发

`dispatch-event` 动作同时做了两层派发（`dispatch-event.ts`）：

```typescript
export const dispatchEventAction = (action, context) => {
  const config = action.config;

  // 第一层：内部 eventBus — 同页面 Schema 内的组件间通信
  context.eventBus.emit(config.eventName, config.detail);

  // 第二层：window CustomEvent — 跨页面/与宿主系统通信
  const customEvent = new CustomEvent(config.eventName, {
    detail: config.detail,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(customEvent);
};
```

### 6.3 内部 eventBus（Schema 内通信）

`eventBus` 由宿主应用在 `actionContextFactory` 中创建：

```typescript
// PageDetail.tsx / PagePreview.tsx — actionContextFactory
const eventHandlers = {};

const actionContext = {
  eventBus: {
    emit: (name, detail) => {
      (eventHandlers[name] || []).forEach(handler => handler(detail));
    },
    on: (name, handler) => {
      if (!eventHandlers[name]) eventHandlers[name] = [];
      eventHandlers[name].push(handler);
      return () => { /* 取消订阅 */ };
    },
  },
};
```

> **当前局限**：`eventBus.on` 目前只在宿主的 `actionContextFactory` 中使用，供宿主代码监听 Schema 内触发的事件。Schema 组件本身不直接调用 `eventBus.on`（因为事件绑定需要是纯 JSON）。**这是预留的扩展点**——未来可以通过类似 `addEventListener` 的动作类型在 Schema 中注册事件监听。

### 6.4 window CustomEvent（跨系统通信）

第二层派发使用原生 DOM 的 `CustomEvent`，使**页面外的代码**也能监听 Schema 内的事件：

| 监听方 | 如何监听 | 示例 |
|--------|---------|------|
| 宿主代码（PageDetail.tsx） | `window.addEventListener('name', handler)` | Schema 通知页面外部的导航栏更新 |
| 第三方脚本/嵌入 | `window.addEventListener('name', handler)` | 埋点 SDK 监听自定义事件 |
| 同页面其他 Schema 组件 | 暂不支持（预留扩展） | `addEventListener` 动作 |

### 6.5 与 VariableStore 对比

| 对比维度 | VariableStore | EventBus |
|---------|--------------|----------|
| **通信模式** | 状态驱动（存 → 取） | 信号驱动（发 → 收） |
| **数据传递** | 存储状态，可多次读取 | 一次性信号，不持久化 |
| **是否触发渲染** | ✅ 自动触发依赖组件重渲染 | ❌ 不触发，需手动处理 |
| **适合场景** | 数据联动、条件显隐 | 操作通知、生命周期钩子 |

---

## 7. 五条链路如何协作

五条通信链路在渲染流程中交织协作：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    完整的渲染与通信流程                               │
│                                                                     │
│  ╔══════════════════════════════════════════════════════════════╗    │
│  ║                    初次渲染阶段                               ║    │
│  ║                                                             ║    │
│  ║  PageRenderer 递归遍历 SchemaNode 树                         ║    │
│  ║    ↓                                                         ║    │
│  ║  每个 RenderNode:                                             ║    │
│  ║    ① extractNodeVariableDeps(node.props) → 提取变量依赖       ║    │
│  ║    ② useVariableSubscription(deps) → 订阅指定变量             ║    │
│  ║    ③ applyMiddlewares → 执行中间件链                          ║    │
│  ║    ④ Component → 渲染为真实 DOM                              ║    │
│  ║                                                             ║    │
│  ╚══════════════════════════════════════════════════════════════╝    │
│                         ↓                                          │
│  ╔══════════════════════════════════════════════════════════════╗    │
│  ║                    交互响应阶段                               ║    │
│  ║                                                             ║    │
│  ║  用户点击按钮 → 原生 DOM 事件 → EventHandlerWrapper          ║    │
│  ║    ↓                                                         ║    │
│  ║  createBindingHandler → executeActions(动作链)                ║    │
│  ║    ↓                                                         ║    │
│  ║  setVariableAction → variableStore.set(key, value)           ║    │
│  ║    ↓                                                         ║    │
│  ║  store 通知订阅者 → useSyncExternalStore → React re-render   ║    │
│  ║                                                             ║    │
│  ╚══════════════════════════════════════════════════════════════╝    │
│                         ↓                                          │
│  ╔══════════════════════════════════════════════════════════════╗    │
│  ║                    更新渲染阶段                               ║    │
│  ║                                                             ║    │
│  ║  仅依赖该变量的 RenderNode 重渲染（其他节点不变）               ║    │
│  ║    ↓                                                         ║    │
│  ║  中间件用最新变量值重新处理：                                   ║    │
│  ║    variableParser → {{key}} → 最新值                         ║    │
│  ║    conditionMiddleware → 重新判断显隐                         ║    │
│  ║    ↓                                                         ║    │
│  ║  DOM 更新（用户看到变化）                                     ║    │
│  ║                                                             ║    │
│  ╚══════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────┘
```

### 跨组件通信场景对比

| 场景 | 推荐链路 | 原因 |
|------|---------|------|
| 表单输入 → 文本展示 | **变量系统** | 需要状态持久化和精准更新 |
| 表单内部字段联动 | **范围上下文 (FormContext)** | 作用域隔离，不污染全局 |
| 点击按钮 → API → 更新数据 | **事件 + 变量系统** | 事件触发动作链，API 结果存变量 |
| 弹窗打开/关闭 | **范围上下文 (ModalContext)** | 弹窗状态属于 ModalProvider 的范围 |
| 条件显隐 | **变量系统 + 条件中间件** | 变量变化自动触发条件重判断 |
| 解耦通知/自定义事件 | **事件总线 (EventBus)** | 不需要状态，只需通知"发生了" |
| 跨页面通信 | **window CustomEvent** | 全局 DOM 事件 |

### 典型场景流程日志

```
组件 A (表单输入框)
  ├── props: { name: "username", value: "{{username}}" }
  ├── events: [{ event: "change", actions: [
  │     { type: "set-variable", config: { key: "username", value: "{{username}}" } }
  │   ]}]
  └── 变量依赖: ["username"]

         ↓ 用户输入 → change 事件 → set-variable

VariableStore.set("username", "新值")
         ↓ 通知订阅者

组件 B (文本展示)                         组件 C (条件容器)
  ├── props: { content: "你好，{{username}}！" }  ├── props: { condition: { field: "username", ... } }
  ├── 变量依赖: ["username"]                      ├── 变量依赖: ["username"]
  └── 只重新渲染 Text 组件                       └── 只重新判断显隐

组件 D (其他不依赖 username 的组件) → 完全不重渲染
```

---

## 8. 数据流全景：一个完整的互动流程

以**表单输入 → 实时更新文本展示 → 条件按钮显隐**为例：

### 步骤 1：Schema 配置（编辑器中）

```json
{
  "root": {
    "id": "root",
    "type": "container",
    "children": [
      {
        "id": "input-1",
        "type": "form-input",
        "props": {
          "label": "你的名字",
          "name": "username",
          "placeholder": "请输入姓名"
        },
        "events": [{
          "event": "change",
          "actions": [{
            "id": "act-1",
            "type": "set-variable",
            "config": {
              "key": "username",
              "value": "{{username}}"
            }
          }]
        }]
      },
      {
        "id": "text-1",
        "type": "text",
        "props": {
          "content": "你好，{{username}}！"
        }
      },
      {
        "id": "btn-1",
        "type": "button",
        "props": {
          "text": "发送私信",
          "condition": {
            "field": "username",
            "operator": "ne",
            "value": ""
          }
        }
      }
    ]
  }
}
```

### 步骤 2：初次渲染

| 组件 | 变量依赖提取 | 渲染结果 |
|------|-------------|---------|
| `input-1` | `["username"]`（props 中没有 `{{}}`，但事件中有） | 输入框，无模板变量所以不依赖 |
| `text-1` | `["username"]`（content 中有 `{{username}}`） | "你好，！"（空字符串） |
| `btn-1` | `["username"]`（condition.field 为 `username`） | 按钮可见（"" !== "" 为 false，按钮隐藏？不，"ne" 判断 "" !== "" 为 false，所以隐藏） |

> **注意**：`extractNodeVariableDeps` 只扫描 `node.props` 中的字符串值和 `condition.field`。事件中的 `{{username}}` 不会被提取为变量依赖，因为事件配置在 `node.events` 中，不在 `node.props` 中。

### 步骤 3：用户输入交互

```
用户输入 "张三" → 输入框 change 事件触发
  ↓
EventHandlerWrapper 捕获 DOM change 事件
  ↓
createBindingHandler 执行动作链
  ↓
setVariableAction: context.variables.set("username", "张三")
  ↓
VariableStore.set("username", "张三")
  ↓
通知 subscribers: text-1 的 subscribeKey("username") 被调用
                 btn-1 的 subscribeKey("username") 被调用
                 input-1 subscribeAll 被调用（无变量依赖但有全局兜底）
```

### 步骤 4：精准重渲染

```
useSyncExternalStore 的 onStoreChange 被触发
  ↓
React 调用 getSnapshot → 新的快照 "{"username":"张三"}"
  ↓
Object.is 比较 → 和上一次快照不同
  ↓
只有 text-1 和 btn-1 的 RenderNode 重新渲染
```

**text-1 的中间件重执行：**

```typescript
// 变量解析中间件将 props 中的 {{username}} 替换
node.props.content: "你好，张三！"  // ← "{{username}}" 被替换为 "张三"

// 渲染真实 DOM
<div>你好，张三！</div>
```

**btn-1 的中间件重执行：**

```typescript
// 条件求值中间件重新判断
condition: { field: "username", operator: "ne", value: "" }
context["username"] = "张三"

// evaluateCondition
// "张三" !== "" → true
// 条件满足，渲染按钮

<button>发送私信</button>  // ← 之前隐藏，现在可见
```

### 步骤 5：input-1 为什么不重渲染？

`input-1` 的 `extractNodeVariableDeps` 返回空数组 `[]`。虽然它通过 `subscribeAll` 收到了通知，但 `makeSnapshot([])` 返回 `''`，两次快照相同，React 不会触发重渲染。这对性能是好的——输入框不依赖变量，不需要重渲染。

---

## 9. 架构演进：从全量渲染到精准订阅

### 7.1 旧架构问题

```
Before（重构前）:
pageVarsRef → setVariable → setVarVersion(n+1) → 全树 re-render
                                                    ↓
                              所有 RenderNode + 所有中间件重执行
                                                    ↓
                              复杂度 O(N)，N = 节点数
```

**三个问题：**
1. **粒度粗**：改 1 个变量 → N 个节点全重渲染
2. **Web 端无更新**：`PageDetail` 没调 `setVarVersion`，界面不更新
3. **没有利用 React 18 的能力**

### 7.2 新架构设计

```
After（重构后）:
VariableStore.set(key, value) → notify subscribers → 仅依赖该变量的节点 re-render
                                                     ↓
                              仅该节点的中间件重执行
                                                     ↓
                              复杂度 O(1) ~ O(K)，K = 依赖该变量的节点数
```

### 7.3 关键 API 对比

| 能力 | 旧方案 | 新方案 |
|------|-------|-------|
| 变量存储 | `useRef<Record<string, unknown>>` | `VariableStore` 类 |
| 触发更新 | 手动 `setVarVersion(n+1)` | 自动 `store.set()` → 通知订阅者 |
| 订阅粒度 | 全部节点 | 按变量名精准订阅 |
| 快照对比 | 无 | `Object.is` + `JSON.stringify` 快照 |
| React API | `useState(0)` | `useSyncExternalStore` |
| Modal 支持 | 无 | `ModalChildNode` 同样订阅 |

### 7.4 兼容性

```
旧 schema 数据格式 → 不需要迁移
非变量场景 → 行为完全不变
已有事件绑定 → 正常工作（事件系统未改动）
```

---

## 10. 面试常见问题

### Q1：低代码平台中组件之间是怎么通信的？

面试官想听到的是对**多种通信机制**的理解，不仅仅是技术细节，还包括**为什么需要这些机制**。

**回答要点：**

低代码平台的渲染引擎面对的核心挑战是：**页面描述是静态 JSON（Schema），组件树不在同一个 React 组件的 props 中传递，因此不能像普通 React 应用那样通过 props 或回调函数通信**。

我们的解决方案包含五条通信链路：

1. **变量系统（状态共享）**：通过一个可观察的 `VariableStore` 存储所有页面级状态。组件 A 写入变量（通过事件动作 `set-variable`），组件 B 在渲染时通过 `{{variableName}}` 模板语法或 `condition` 条件引用变量。当变量变化时，只有**依赖该变量的组件**会重新渲染（使用 `useSyncExternalStore` 实现按需订阅）。

2. **事件系统（行为触发）**：用户在编辑器中将 DOM 事件（click、change 等）绑定到一个动作链（set-variable、toast、call-api 等），事件系统在运行时通过原生 `addEventListener` 绑定事件，触发后串行执行动作链。

3. **中间件系统（渲染管道）**：采用洋葱模型，每个节点渲染时经过中间件链处理——事件绑定（最外层）→ 样式注入 → 条件求值 → 变量替换（最内层）→ 组件渲染。中间件可以修改节点属性、跳过渲染或注入额外 DOM 层。

4. **范围上下文（父子范围通信）**：Form 容器通过 `FormContext` 管理字段值，子组件通过 `useFormContext()` 读写；ModalProvider 通过 `ModalContext` 管理弹窗状态。生命周期限定在 Provider 子树内，天然隔离。

5. **事件总线（解耦信号通信）**：`dispatch-event` 动作同时向内部 `eventBus` 和 `window.CustomEvent` 派发事件，实现组件间或与宿主系统的解耦通知。

**对比常见面试点：**
- 和 React 组件的 props 传递不同：低代码组件依赖的数据是声明式的（写在 JSON Schema 中），不是通过 JSX props 传递的
- 数据流是**事件驱动**的：用户交互 → 事件 → 动作 → 变量变化 → 订阅者重渲染
- 通信是**面向数据**的：组件之间只通过共享变量间接通信，没有直接的组件引用
- **5 种机制各有侧重**：变量系统适合数据联动，事件系统适合交互触发，中间件系统适合渲染期注入，React Context 适合父子范围通信，EventBus 适合解耦信号通知

### Q2：变量绑定的实现原理？`{{key}}` 是怎么替换的？

**回答要点：**

变量绑定通过两层机制实现：

**第一层：运行时的模板替换**
- `createDynamicVariableParserMiddleware` 中间件在每次渲染时扫描 `node.props` 中的字符串值
- 通过正则 `/\{\{([^}]+)\}\}/g` 匹配 `{{key}}` 模式
- 从 `VariableStore.getAll()` 中读取当前变量值进行替换

**第二层：条件驱动的显隐控制**
- `createDynamicConditionMiddleware` 读取 `node.props.condition`
- 支持 10 种运算符：eq、neq、gt、lt、gte、lte、contains、notContains、in、notIn
- 条件不满足时返回 `null` 跳过渲染

**精细化重渲染的支撑**：上述中间件在 `useMemo` 中缓存，缓存的 key 中包含变量快照。只有当组件依赖的变量变化时（通过 `useSyncExternalStore` 检测到快照变化），中间件才会重执行，保证替换和条件判断读到最新值。

### Q3：事件系统是怎么设计的？为什么不用 React 合成事件？

**回答要点：**

1. **JSON 可序列化**：事件绑定是纯数据结构（`EventBinding[]`），不包含函数引用，可以保存到数据库、在编辑器中可视化编辑

2. **12 种内置动作**：覆盖了 toast、导航、弹窗、表单提交、API 调用等常见场景

3. **原生 DOM 事件**：使用原生 `addEventListener` 而非 React 合成事件，原因：
   - **Portal 问题**：弹窗（Modal）通过 Portal 渲染到 `document.body`，React 合成事件的冒泡在 Portal 边界会中断
   - **自定义组件**：很多组件不是标准表单元素，React 的 `onChange` 处理在某些场景下不触发
   - **捕获阶段绑定**：使用 `true` 在捕获阶段监听，确保不被 React 的事件委托拦截

4. **扩展性**：通过 `ActionRegistry` 全局注册表支持运行时扩展，宿主可以注册自定义动作

### Q4：为什么需要重构 VariableStore？之前的设计有什么问题？

**回答要点：**

旧方案是 `pageVarsRef + useState(version)` 的组合：
- 变量存在 `useRef` 中，修改后需要手动调用 `setVarVersion(n+1)` 触发 React 重渲染
- 每次版本号变化，**整个 `PageRenderer` 树**重新执行，即使是完全不依赖变量的组件
- `PageDetail.tsx`（Web 端）没有调用 `setVarVersion`，导致 Web 端变量绑定完全不生效
- 复杂度 O(N)，N 为节点数

新方案引入 `VariableStore + useSyncExternalStore`：
- 每个节点只订阅自己依赖的变量
- 变量变化时只通知相关订阅者
- Web 端自动支持变量动态更新（不再需要手动触发）
- 复杂度 O(K)，K 为依赖该变量的节点数（通常 K << N）

### Q5：如果变量不存在或者值为空会怎么样？

**回答要点：**

这是容错设计中需要考虑的场景：

- **不存在变量**：`variable-parser` 将 `{{unknownVar}}` 替换为空字符串 `''`；`condition` 中间件对不存在字段求值时 `evaluateCondition` 中 `context[field]` 为 `undefined`，根据运算符判断
- **空值变量**：`value === undefined || value === null || value === ''` 时返回 `''`
- **类型不匹配**：`eq` 运算符做了容错——先严格比较，失败后尝试 `String(actualValue) === String(value)` 字符串比较
- **动作执行失败**：`executeActions` 中 `try/catch` 捕获异常，单个动作失败不影响后续动作执行

### Q6：数据流画一下完整的流程图？

用文字描述即可（面试中需要画在白板上）：

```
用户输入 → DOM 事件 → EventBinding.actions
  → executeActions(动作链)
    → set-variable 动作: context.variables.set("key", "value")
      → VariableStore.set → 通知 subscribeKey("key") 的所有订阅者
        → useSyncExternalStore.onStoreChange 被调用
          → React 调用 getSnapshot → 新快照 vs 旧快照
            → Object.is 不同 → 组件重渲染
              → useMemo(middleware) 重新计算
                → variableParser: {{key}} → 新值
                → conditionMiddleware: 重新判断显隐
                  → React 更新 DOM
```

### Q7：如何在渲染中识别组件 A 依赖了哪些变量？

通过 `extractNodeVariableDeps` 函数在渲染期**自动扫描**：

```typescript
// 扫描两个来源：
// 1. node.props 字符串值中的 {{variableName}}
// 2. node.props.condition.field
```

这种方案的好处是**不需要在 Schema 中声明变量依赖**（如小程序中需要声明 `useData`），完全由运行时自动分析。局限是如果变量引用出现在 `node.events` 中（如事件动作的 config），不会被自动提取，需要借助 `subscribeAll` 兜底。

### Q8：如果点击一个按钮要同时触发多个动作，怎么实现？

**回答要点：**

`EventBinding.actions` 是一个数组，**按顺序串行执行**：

```json
{
  "event": "click",
  "actions": [
    { "id": "1", "type": "set-variable", "config": { "key": "loading", "value": true } },
    { "id": "2", "type": "call-api", "config": { "url": "/api/submit", "assignTo": "result" } },
    { "id": "3", "type": "set-variable", "config": { "key": "loading", "value": false } },
    { "id": "4", "type": "toast", "config": { "type": "success", "message": "提交成功" } }
  ]
}
```

`call-api` 动作支持 `onSuccess` 和 `onError` 嵌套子动作链，递归调用 `executeActions` 执行。

### Q9：FormContext 和 VariableStore 有什么区别？什么时候该用哪个？

**回答要点：**

这是**作用域管理**的问题。

| 维度 | VariableStore | FormContext |
|------|--------------|------------|
| **作用域** | 整个页面 | 仅限该 Form 容器子树 |
| **隔离性** | key 需要手动命名避免冲突 | 天然隔离，多个 Form 互不干扰 |
| **生命周期** | 页面级别 | Form 组件挂载/卸载 |
| **更新粒度** | 按 key 精准订阅 | 所有字段共享一个 values 对象 |
| **是否触发渲染** | `useSyncExternalStore` 按需重渲染 | `useState` 更新 → 消费 Context 的组件重渲染 |

**选择原则：**
- 需要**跨组件、跨容器共享数据** → `VariableStore`（如：表单输入同步到页面其他位置展示）
- 数据**只在表单内部使用**，不关心外部 → `FormContext`（如：表单验证状态、提交状态）
- 同一个页面有**多个独立表单** → `FormContext` 天然隔离。如果用 VariableStore 则需要 `form1_email`、`form2_email` 手动区分

### Q10：为什么需要 5 种通信机制？是不是太多了？

**回答要点：**

5 种机制不是设计出来的，而是从实际需求中自然演化出来的，各解决一类问题：

```
面对的问题                                解决方案
────────────────────────────────────────────────────
A 组件改数据 → B 组件看到最新值       → VariableStore (状态共享)
用户点了按钮 → 触发一系列操作         → 事件系统 (行为触发)
渲染时注入样式/事件/变量             → 中间件系统 (渲染管道)
表单内父子组件共享字段值             → FormContext (范围通信)
只需通知"发生了"不需共享状态         → EventBus (信号通信)
```

每种机制都有自己的定位，覆盖不同的通信模式：
- **VariableStore ≠ EventBus**：一个是"存状态等别人读"，一个是"发信号不关心谁收"
- **VariableStore ≠ FormContext**：一个是页面级广播，一个是 Form 级范围隔离
- **中间件 ≠ 其他**：中间件发生在渲染期间，不是运行时通信

**简化版（面试说这个即可）**：
> 核心就两条线：**变量系统 + 事件系统**。事件触发行为、变量存储状态、中间件在渲染时注入。FormContext 是 React Context 的标准用法，EventBus 是轻量级的解耦通知——它们都是对核心模式的补充，不是新的概念。

---

## 总结

低代码平台的组件间通信不是通过传统的 React Props 或回调实现的，而是通过 **变量系统（状态存储）、事件系统（行为触发）、中间件系统（渲染管道）、范围上下文（React Context）、事件总线（解耦信号）** 五条链路协同完成。

核心设计思想是：
1. **数据与行为分离**：状态存储在 `VariableStore` 中，行为定义为 JSON 事件绑定
2. **声明式渲染**：组件不直接引用其他组件，而是通过变量间接耦合
3. **精准更新**：利用 `useSyncExternalStore` 实现按需重渲染，避免全树刷新
4. **范围隔离**：FormContext / ModalContext 利用 React Context 天然的范围性实现父子通信
5. **可扩展**：中间件、动作注册表、事件总线都支持运行时扩展

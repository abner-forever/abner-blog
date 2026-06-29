# Modal 弹窗组件实施文档 v2

## 设计决策总览

| # | 决策项 | 选择 | 理由 |
|---|--------|------|------|
| 1 | Schema 树中位置 | 根节点的直接子节点 | Modal 不属于页面内容流，语义上是浮层 |
| 2 | 运行时可见性 | React 状态管理（`modalStates`） | 支持动画过渡，符合 React 哲学 |
| 3 | 运行时渲染 | `ReactDOM.createPortal` 到 `document.body` | 避免父容器 z-index/overflow 干扰 |
| 4 | 编辑器编辑方式 | 切换式（画布同一时间只显示一个 modal 或页面主体） | 画布干净，编辑空间大 |
| 5 | Modal 列表来源 | 从 GrapesJS 组件树动态提取 | 单一数据源，不需要额外状态同步 |
| 6 | 拖入画布行为 | 自动切换画布显示新 modal | 体验流畅，用户可立即编辑内容 |
| 7 | 数据传递 | 通过 `variables` 系统，命名空间 `modal.{id}.{key}` | 复用现有基础设施 |
| 8 | 事件配置 UI | `modalList` 作为 prop 传入 `EventBindingTabContent` | 保持组件解耦 |
| 9 | MVP 属性集 | title, name, width, closable, maskClosable, keyboard, footer, animation | 动画是核心体验差异点 |
| 10 | 画布渲染结构 | 双区域：`page-content` + `modals-container` | Modal 子组件享受 GrapesJS 原生编辑能力 |
| 11 | 命名与导出 | `name`（编辑器标识）+ `title`（弹窗标题）；通过 `type` 区分，不改 PageSchema 结构 | 简洁，和现有体系一致 |

## 架构设计

### Schema 树结构

```
PageSchema.root
├── section (Hero 区域)
├── container (内容区)
│   ├── text
│   └── button (事件: open-modal → modal-xxx)
├── modal (id: "modal-xxx", name: "确认弹窗")    ← 根的直接子节点
│   └── container (弹窗内容)
│       ├── text ("确定要删除吗？")
│       └── button ("确定", 事件: close-modal → modal-xxx)
└── modal (id: "modal-yyy", name: "表单弹窗")
    └── container
        ├── form-input
        └── button ("提交")
```

**SchemaNode 扩展：**
```typescript
// Modal 节点的 props 结构
interface ModalNodeProps {
  name: string;              // 编辑器内标识（"确认弹窗"）
  title?: string;            // 弹窗上显示的标题
  width?: number | string;   // 弹窗宽度，默认 520
  closable?: boolean;        // 显示关闭按钮，默认 true
  maskClosable?: boolean;    // 点击遮罩关闭，默认 true
  keyboard?: boolean;        // ESC 关闭，默认 true
  footer?: boolean;          // 显示 footer，默认 true
  animation?: 'fade' | 'zoom' | 'slide';  // 动画类型，默认 fade
  style?: React.CSSProperties;
}
```

**Schema 导出不变：** Modal 就是 root.children 中 `type === 'modal'` 的节点，`PageSchema` 结构不需要修改。

### GrapesJS 画布结构（双区域）

```
gjs-wrapper (GrapesJS 根)
├── page-content (div, 包装所有非 modal 组件)
│   ├── section
│   └── container
└── modals-container (div, 包装所有 modal)
    ├── modal-1 (编辑器中渲染为可编辑的弹窗框)
    └── modal-2
```

- **编辑页面时：** `.page-content` 可见，`.modals-container` 隐藏
- **编辑 modal 时：** `.page-content` 隐藏，目标 modal 可见，其余 modal 隐藏
- 通过 CSS class `.gjs-editing-modal` 控制

### 运行时渲染架构

```tsx
// RendererProvider 中新增 ModalProvider
<ModalProvider>
  {/* 正常渲染页面内容（遇到 modal 节点时跳过） */}
  <PageRenderer schema={schema} />

  {/* 通过 Portal 渲染所有 modal */}
  {modalNodes.map(node => (
    <ModalPortal key={node.id} node={node} visible={modalStates[node.id]} />
  ))}
</ModalProvider>
```

**ModalPortal 组件结构：**
```tsx
function ModalPortal({ node, visible }: { node: SchemaNode; visible: boolean }) {
  const props = node.props as ModalNodeProps;

  return createPortal(
    <div className={`modal-overlay modal-${props.animation || 'fade'} ${visible ? 'modal-visible' : ''}`}
         onClick={props.maskClosable !== false ? () => modals.close(node.id) : undefined}>
      <div className="modal-content" style={{ width: props.width || 520 }}>
        {props.title && <div className="modal-header">{props.title}</div>}
        <div className="modal-body">
          <RenderNode node={/* 弹窗内容节点 */} />
        </div>
        {props.footer !== false && <div className="modal-footer">...</div>}
      </div>
    </div>,
    document.body
  );
}
```

**显示/隐藏机制：**
- `modalStates: Record<string, boolean>` 存在 React state 中
- `open-modal` action → `setModalStates(prev => ({ ...prev, [modalId]: true }))`
- `close-modal` action → `setModalStates(prev => ({ ...prev, [modalId]: false }))`
- 动画通过 CSS transition + `.modal-visible` class 实现

**数据传递：**
- `open-modal` 执行时，`data` 写入 `variables`：`modal.{modalId}.{key} → value`
- Modal 内部组件通过 `$vars.get('modal.xxx.key')` 读取

## 文件改动清单

### packages/page-schema/（Schema 类型 + 渲染引擎）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types.ts` | 修改 | 追加 `MODAL: 'modal'`、`ModalNodeProps` 接口 |
| `src/components/Modal.tsx` | **新建** | Portal 渲染的 Modal 运行时组件（遮罩 + 动画 + 焦点管理） |
| `src/components/index.ts` | 修改 | 导出 Modal |
| `src/renderer.tsx` | 修改 | `RenderNode` 遇到 `type === 'modal'` 时跳过（由 ModalProvider 统一 Portal 渲染） |
| `src/provider.tsx` | 修改 | 新增 `ModalProvider`，管理 `modalStates`，扫描 schema 中的 modal 节点 |
| `src/event-engine/built-in-actions/modal.ts` | 修改 | `open-modal` 写入 variables，同时更新 modalStates |

### apps/editor/（GrapesJS 编辑器）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/PageEditor/blocks.ts` | 修改 | 添加 Modal block + 新增「交互组件」分类 |
| `src/utils/schemaConverter.ts` | 修改 | 追加 `extractModalProps` 和 `modal` 类型映射；modal 作为根级节点处理 |
| `src/pages/PageEditor/index.tsx` | 修改 | 注册 Modal 组件类型；实现双区域渲染 + 切换逻辑；提取 `modalList` 传给 sidebar |
| `src/pages/PageEditor/index.less` | 修改 | 双区域切换样式 + modal 编辑态样式 |
| `src/pages/PageEditor/EventBindingTabContent.tsx` | 修改 | `open-modal`/`close-modal` 配置改为 Select 下拉（接收 `modalList` prop） |

### apps/web/（运行时消费端）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/page/PageDetail.tsx` | 修改 | 移除 DOM 操作式的 modals 实现，改用 `ModalProvider` 提供的 context |

## 实现顺序

### Phase 1: Schema 与类型基础
1. `types.ts` — 新增 `MODAL` 常量 + `ModalNodeProps` 接口
2. `components/Modal.tsx` — 运行时 Modal 组件（Portal + 遮罩 + 动画 + header/body/footer）
3. `components/index.ts` — 导出

### Phase 2: 渲染引擎集成
4. `provider.tsx` — 新增 `ModalProvider`（管理 `modalStates`，扫描 schema 中的 modal 节点）
5. `renderer.tsx` — `RenderNode` 跳过 modal 节点，`PageRenderer` 顶层渲染 `ModalPortal` 列表
6. `built-in-actions/modal.ts` — `open-modal` 更新 modalStates + 写入 variables；`close-modal` 更新 modalStates
7. `PageDetail.tsx` — 移除旧的 DOM 操作实现

### Phase 3: 编辑器集成
8. `blocks.ts` — Modal block 定义（拖入画布时创建 modal 节点）
9. `schemaConverter.ts` — Modal 节点的类型识别和 props 提取
10. `index.tsx` — 双区域渲染 + modal 切换 + modalList 提取
11. `index.less` — 双区域切换样式
12. `EventBindingTabContent.tsx` — Select 下拉替换文本输入

## 关键技术方案

### 1. 编辑器双区域渲染

```typescript
// index.tsx - GrapesJS 初始化后，构建双区域结构
editor.on('load', () => {
  const wrapper = editor.DomComponents.getWrapper();
  const allComponents = wrapper.components();

  // 创建两个容器
  const pageContent = wrapper.append('<div data-gjs-type="page-content"></div>')[0];
  const modalsContainer = wrapper.append('<div data-gjs-type="modals-container"></div>')[0];

  // 把现有组件移到 page-content
  allComponents.each(comp => {
    if (comp !== pageContent && comp !== modalsContainer) {
      if (comp.get('data-schema-type') === 'modal') {
        modalsContainer.append(comp);
      } else {
        pageContent.append(comp);
      }
    }
  });
});
```

### 2. Modal 切换编辑

```typescript
const [activeModalId, setActiveModalId] = useState<string | null>(null);

// 切换时通过 CSS 控制可见性
useEffect(() => {
  const wrapper = editor.DomComponents.getWrapper();
  const pageContent = wrapper.find('[data-gjs-type="page-content"]')[0];
  const modalsContainer = wrapper.find('[data-gjs-type="modals-container"]')[0];

  if (activeModalId) {
    // 编辑 modal：隐藏页面，显示目标 modal
    pageContent?.addClass('gjs-hidden');
    modalsContainer?.addClass('gjs-visible');
    modalsContainer?.components().each(comp => {
      comp.toggleClass('gjs-hidden', comp.getId() !== activeModalId);
    });
  } else {
    // 编辑页面：显示页面，隐藏所有 modal
    pageContent?.removeClass('gjs-hidden');
    modalsContainer?.removeClass('gjs-visible');
  }
}, [activeModalId, editor]);
```

### 3. Modal 列表提取

```typescript
function getModalList(editor: Editor): { label: string; id: string }[] {
  const wrapper = editor.DomComponents.getWrapper();
  const modalsContainer = wrapper.find('[data-gjs-type="modals-container"]')[0];
  if (!modalsContainer) return [];

  return modalsContainer.components().map(comp => ({
    label: comp.get('data-modal-name') || comp.get('data-schema-label') || '未命名弹窗',
    id: comp.getId(),
  }));
}
```

### 4. Modal Block 定义

```typescript
// blocks.ts
{
  id: 'modal',
  label: '弹窗',
  category: { id: 'interactive', label: '交互组件' },
  content: {
    type: 'modal',
    'data-schema-type': 'modal',
    'data-modal-name': '新弹窗',
    attributes: { 'data-gjs-type': 'modal' },
    components: [
      {
        type: 'container',
        'data-schema-type': 'container',
        style: { padding: '20px', minHeight: '100px' },
        components: [],
      },
    ],
  },
}
```

### 5. 运行时 Modal 组件（CSS 动画）

```less
// modal.less
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;

  &.modal-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  // Zoom 动画
  .modal-zoom & {
    transform: scale(0.8);
    transition: transform 0.25s ease;
  }
  .modal-zoom.modal-visible & {
    transform: scale(1);
  }

  // Slide 动画
  .modal-slide & {
    transform: translateY(-30px);
    transition: transform 0.25s ease;
  }
  .modal-slide.modal-visible & {
    transform: translateY(0);
  }
}
```

### 6. Schema 转换器处理

```typescript
// schemaConverter.ts
function convertModalNode(component: any): SchemaNode {
  return {
    id: component.getId(),
    type: 'modal',
    props: {
      name: component.get('data-modal-name') || '未命名弹窗',
      title: component.get('data-modal-title') || '',
      width: component.get('data-modal-width') || 520,
      closable: component.get('data-modal-closable') !== false,
      maskClosable: component.get('data-modal-mask-closable') !== false,
      keyboard: component.get('data-modal-keyboard') !== false,
      footer: component.get('data-modal-footer') !== false,
      animation: component.get('data-modal-animation') || 'fade',
    },
    children: convertChildren(component),
    events: extractEvents(component),
  };
}

// buildPageSchema 中：modal 作为根的直接子节点
function buildPageSchema(editor: Editor): PageSchema {
  const wrapper = editor.DomComponents.getWrapper();
  const pageContent = wrapper.find('[data-gjs-type="page-content"]')[0];
  const modalsContainer = wrapper.find('[data-gjs-type="modals-container"]')[0];

  const pageChildren = pageContent ? convertChildren(pageContent) : [];
  const modalNodes = modalsContainer
    ? modalsContainer.components().map(convertModalNode)
    : [];

  return {
    root: {
      id: 'root',
      type: 'container',
      props: {},
      children: [...pageChildren, ...modalNodes],
    },
  };
}
```

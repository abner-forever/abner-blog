# @abner-blog/page-schema

页面 Schema 渲染引擎，用于低代码页面的组件注册、中间件、事件系统和模态框管理。

## 功能

- **组件注册**：支持自定义组件的注册和渲染
- **中间件**：页面渲染过程中的中间件支持
- **事件系统**：组件间的事件通信机制
- **模态框**：内置模态框组件和管理
- **类型安全**：完整的 TypeScript 类型定义

## 安装

```bash
pnpm add @abner-blog/page-schema
```

## 使用

```tsx
import { PageRenderer } from '@abner-blog/page-schema';

// 定义页面 Schema
const pageSchema = {
  components: [
    {
      type: 'text',
      props: {
        content: 'Hello World',
      },
    },
  ],
};

// 渲染页面
function App() {
  return <PageRenderer schema={pageSchema} />;
}
```

## API

### PageRenderer

页面渲染组件，接收 Schema 并渲染为 React 组件。

**Props:**
- `schema`: 页面 Schema 对象
- `middleware`: 可选的中间件数组
- `onEvent`: 事件回调函数

### registerComponent

注册自定义组件。

```tsx
import { registerComponent } from '@abner-blog/page-schema';

registerComponent('custom-component', CustomComponent);
```

### createMiddleware

创建页面渲染中间件。

```tsx
import { createMiddleware } from '@abner-blog/page-schema';

const logger = createMiddleware((next) => (schema) => {
  console.log('Rendering schema:', schema);
  return next(schema);
});
```

## 相关文档

- 仓库总览：[根目录 `README.md`](../../README.md)
- 低代码编辑器：[`apps/editor`](../../apps/editor/README.md)

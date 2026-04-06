---
name: react-dev
description: 前端开发规范（React 18 + Vite 6 + Ant Design 6 + Redux Toolkit + TanStack Query）。适用于 apps/web（用户站）与 apps/admin（管理后台）：页面/组件、样式、状态、API、路由、Orval 生成客户端。
---

# React 开发规范

## 技术栈

| 层级        | 技术                        |
| ----------- | --------------------------- |
| UI 框架     | React 18 + TypeScript 5.9   |
| 构建工具    | Vite 6                      |
| UI 组件库   | Ant Design 6                |
| 路由        | React Router v6             |
| 全局状态    | Redux Toolkit               |
| 服务端状态  | TanStack Query v5           |
| HTTP 客户端 | Axios（封装为 HttpService） |
| 国际化      | i18next                     |
| 样式        | LESS（全局变量自动注入）    |
| 测试        | Vitest + Playwright         |

---

## 一、硬约束

- **web** 为 TypeScript `strict`；**admin** 以该应用 `tsconfig.app.json` 为准；两应用新代码均**禁用 `any`**，用 `unknown` + 类型收窄
- 路径**只用别名**（以各应用 `tsconfig.app.json` 为准）：**web** 含 `@/`、`@components/`、`@pages/`、`@services/`、`@store/`、`@hooks/`、`@utils/`、`@routes/`、`@types/` 等；**admin** 当前以 `@/*` 为主，新代码优先沿用应用内既有别名风格
- **禁止**组件内直调 axios/fetch，统一走 `@services/`
- **禁止**硬编码颜色，使用 LESS 变量
- **禁止**硬编码用户文案，必须 i18n
- 新功能增量实现，非必要不重构

---

## 二、目录结构

```
src/
├── pages/           # 页面组件（按模块分目录）
│   └── Module/PageName/
│       ├── index.tsx
│       └── index.less
├── components/      # 共享组件
├── services/        # API 层
│   ├── http.ts      # HttpService 单例
│   ├── api.ts       # API 定义
│   └── generated/   # orval 生成的 API
├── store/           # Redux slices
├── hooks/           # 自定义 hooks
├── utils/           # 纯函数工具
├── routes/          # 路由配置
├── i18n/            # 国际化
└── styles/          # 全局样式
```

### 2.1 工作区共享包

- **web** 已依赖 `@abner-blog/utils`、`@abner-blog/upload` 等；通用逻辑优先抽到 `packages/*` 并通过 `workspace:*` 引用，避免在应用间复制粘贴

---

## 三、组件开发

### 3.1 文件结构顺序

```typescript
// 1. React + 第三方 import
import { useState, useCallback } from 'react';
import { Button } from 'antd';

// 2. 内部 import（按别名分组）
import { blogAPI } from '@services/api';
import { useAppSelector } from '@store/index';
import './index.less';

// 3. 类型定义
interface Props {
  id: number;
  onSubmit?: () => void;
}

// 4. 组件实现
const MyComponent: React.FC<Props> = ({ id, onSubmit }) => {
  // hooks 顺序：state -> ref -> selector -> custom hooks
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  // 回调
  const handleClick = useCallback(() => { ... }, [deps]);

  // 渲染
  return ( ... );
};

export default MyComponent;
```

### 3.2 必须处理三态

- **Loading 状态**：`Spin` / `Skeleton` / `Button loading`
- **空状态**：`CustomEmpty` 组件
- **错误状态**：`message.error` + i18n 错误文本

### 3.3 其他约束

- 危险操作**必须**使用 `Popconfirm` 二次确认
- 组件超过 **200 行**考虑拆分
- 页面组件**必须懒加载**：
  ```typescript
  const BlogDetail = React.lazy(() => import("@pages/blog/BlogDetail"));
  ```

---

## 四、样式规范

### 4.1 核心原则

**禁止硬编码**，必须使用 LESS/CSS 变量：

```less
// ✅ 正确
.my-card {
  background: @card-bg;
  color: @text-main;
  border-color: @border-color;
}

// ❌ 错误
.my-card {
  background: #ffffff;
  color: #333333;
  border-color: #e2e8f0;
}
```

### 4.2 颜色变量

```less
// 主要颜色（跟随皮肤切换）
@primary-color: var(--primary-color);
@primary-hover: var(--primary-hover);

// 背景色
@bg-color: var(--bg-color); // 页面背景
@card-bg: var(--card-bg); // 卡片背景

// 文字颜色
@text-main: var(--text-main); // 主要文字
@text-secondary: var(--text-secondary); // 次要文字
@text-muted: var(--text-muted); // 辅助/禁用文字

// 边框/分割线
@border-color: var(--border-color);
@divider-color: var(--divider-color);

// 阴影
@box-shadow-sm: var(--shadow-sm);
@box-shadow-md: var(--shadow-md);
@box-shadow-lg: var(--shadow-lg);
```

### 4.3 响应式断点

```less
@screen-xs: 320px;
@screen-sm: 576px;
@screen-md: 768px;
@screen-lg: 992px;
@screen-xl: 1200px;
@screen-xxl: 1400px;

// 使用示例
.my-component {
  padding: 12px;

  @media (min-width: @screen-md) {
    padding: 24px;
  }
}
```

### 4.4 常用尺寸

```less
@layout-max-width: 1360px;
@header-height: 64px;
@content-margin-top: 16px;
@border-radius-base: 12px;
@border-radius-sm: 8px;
```

### 4.5 常用 Mixin

```less
// 居中布局
.flex-center() {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 两端对齐
.flex-between() {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 单行省略
.text-ellipsis() {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 多行省略
.text-ellipsis-multiple(@lines: 2) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: @lines;
  overflow: hidden;
}

// 卡片样式
.card-style() {
  background: @card-bg;
  border-radius: 4px;
  transition: all 0.2s;
}
```

### 4.6 BEM 命名

```less
.component-name {
  // 元素 - 用 __ 连接
  &__header {
  }
  &__body {
  }

  // 修饰符 - 用 -- 或 .is-
  &--featured {
  }
  &.is-active {
  }
}
```

### 4.7 响应式工具类

```less
.hide-mobile {
  @media (max-width: @screen-md) {
    display: none !important;
  }
}

.show-mobile {
  @media (min-width: @screen-md) {
    display: none !important;
  }
}
```

### 4.8 移动端适配检查

- [ ] 字体大小是否合适
- [ ] 按钮/输入框高度（移动端 36px，桌面端 40px）
- [ ] 卡片内边距（移动端 16px，桌面端 24px）
- [ ] 弹窗是否溢出
- [ ] 表格是否有横向滚动

### 4.9 样式检查清单

| 检查项   | 要求                        |
| -------- | --------------------------- |
| 颜色值   | 使用 CSS 变量，禁止硬编码   |
| 间距     | 使用 4px 倍数               |
| 圆角     | 使用 @border-radius-base/sm |
| 响应式   | 移动端有适配                |
| BEM 命名 | 类名符合规范                |

### 4.10 最佳实践

1. **优先使用工具类** - `.text-ellipsis`、`.hide-mobile`
2. **避免过度嵌套** - LESS 嵌套不超过 3 层
3. **语义化命名** - `.error-message` 而非 `.red-text`

---

## 五、API 调用

### 5.1 使用方式

```typescript
// ✅ 正确：使用封装好的 API
import { blogAPI } from "@services/api";
const blogs = await blogAPI.getBlogs({ page: 1, pageSize: 10 });

// ❌ 错误：直接使用 axios
import axios from "axios";
const res = await axios.get("/api/blogs");
```

### 5.2 接口联调流程

1. 后端接口变更后：在仓库根目录对 **web** 执行 `pnpm generate:api`；若 **admin** 也调用该接口，再执行 `pnpm --filter @abner-blog/admin generate:api`
2. 页面/hooks 改为调用生成的接口
3. 直接使用生成的类型注解，**禁止使用 `as` 断言**
4. 删除对应手写 API（兼容用途可保留）
5. 执行 typecheck + lint + 测试

### 5.3 响应格式

```typescript
// 成功
{ data: T, message: string, timestamp: string }

// 分页
{ list: T[], total: number, page: number, pageSize: number, totalPages: number }
```

### 5.4 类型使用原则

**必须使用生成的类型，禁止 `as` 二次定义：**

```typescript
// ✅ 正确：直接使用生成的类型
import type { BlogDto, BlogListResponseDto } from "@services/generated/model";
import { blogAPI } from "@services/api";

const response = await blogAPI.getBlogs(params);
const blogList: BlogListResponseDto = response;

// ❌ 错误：使用 as 断言
const blogList = response as unknown as BlogListResponseDto;
```

**如果发现生成的类型是 `{ [key: string]: unknown }`：**

- 说明后端响应 DTO 缺少 `@ApiProperty()` 装饰器
- 需要后端先完善 Swagger 文档，再重新 `pnpm generate:api`

### 5.5 Orval 自动生成接口：命名、入参、返回类型（最佳实践）

本仓库 **web** 使用 Orval（`apps/web/orval.config.ts`）：`tags-split` + `react-query` + 自定义 `httpMutator`。生成物位于 `src/services/generated/`，**禁止手改**（文件头含 `Generated by orval`）。

#### 产物结构

| 路径 | 内容 |
| ---- | ---- |
| `src/services/generated/model/*.ts` | 请求/响应的 TypeScript 类型（按 schema 拆分文件） |
| `src/services/generated/<tag>/<tag>.ts` | 同 Swagger `@ApiTags` 一组接口：`getXxx` 请求函数 + TanStack Query hooks |

类型统一从 `@services/generated/model` 按名导入；按模块调用时从对应 tag 文件导入函数/hooks（如 `weather/weather.ts`）。

#### 命名如何对应 OpenAPI（读生成代码时的约定）

以下以 `GET /api/weather` 为例（见 `generated/weather/weather.ts`）：

1. **请求函数**：`camelCase`，与 OpenAPI **operationId** 一致（Nest 未显式设置时由框架推导）。例如 `getWeather`。
2. **查询/路径/表单入参合并类型**：`{Method}{OperationId}Params`（PascalCase 方法前缀 + operationId）。例如 `GetWeatherParams`，字段与 JSDoc 来自后端 Query DTO 的 `@ApiProperty({ description })`。
3. **返回类型（解包后）**：`httpMutator<T>` 的泛型 `T` 为拦截器 **解包 `data` 之后** 的业务体类型，来自 `@ApiResponse` 引用的 schema。例如 `WeatherInfoResponse`，与后端响应 DTO 在 Swagger 中的 schema 名称一致。
4. **TanStack Query 衍生符号**（同一 operation 自动生成，勿手写重复）：
   - `useGetWeather`：Query hook
   - `getGetWeatherQueryKey`：稳定 `queryKey`（含 params）
   - `getGetWeatherQueryOptions`：组装 `useQuery` 选项
   - `GetWeatherQueryResult`：`Awaited<ReturnType<typeof getWeather>>` 别名，便于组件内标注数据类型

#### 前端使用方式

```typescript
// 类型：只从 generated/model 引用
import type { GetWeatherParams, WeatherInfoResponse } from '@services/generated/model';

// 优先用生成的 hook（已带 queryKey / signal）
import { useGetWeather, getWeather } from '@services/generated/weather/weather';

// React 组件内
const { data, isPending, error } = useGetWeather({ city: '北京' });
// data 推断为 WeatherInfoResponse | undefined（以生成代码为准）

// 非组件或仅需单次请求：传入 AbortSignal 与查询参数
const info = await getWeather({ city: '上海' }, signal);
```

原则：

- **禁止**复制生成类型到业务文件；**禁止**对响应使用 `as` 伪造结构。
- 需要 invalidate/refetch 时，使用 **`getGetWeatherQueryKey(params)`** 与生成逻辑保持一致，避免手写字符串 key 漂移。
- 新增/变更接口后必须 **`pnpm generate:api`**（admin 另见 monorepo 约定），再以新符号名称为准。

---

## 六、状态管理

### 6.1 状态分层

| 状态类型     | 方案            | 示例            |
| ------------ | --------------- | --------------- |
| 全局应用状态 | Redux Toolkit   | 用户信息、主题  |
| 服务端数据   | TanStack Query  | 博客列表、评论  |
| 页面本地状态 | useState        | 表单值、UI 状态 |
| URL 状态     | useSearchParams | 搜索词、分页    |

### 6.2 Redux 使用

```typescript
import { useAppSelector, useAppDispatch } from "@store/index";

const user = useAppSelector((state) => state.auth.user);
const dispatch = useAppDispatch();
```

### 6.3 TanStack Query

```typescript
export function useBlogList(params: BlogQueryParams) {
  return useQuery({
    queryKey: ["blogs", params],
    queryFn: () => blogAPI.getBlogs(params),
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## 七、路由规范

### 7.1 目录结构

页面按**模块划分**，每个模块目录下有独立的路由配置文件：

```
pages/
├── blog/                    # 博客模块
│   ├── BlogList/
│   ├── BlogDetail/
│   ├── CreateBlog/
│   ├── EditBlog/
│   └── routes.ts            # 模块路由配置
├── user/                    # 用户模块
│   ├── Profile/
│   ├── ProfileEdit/
│   ├── MyFavorites/
│   └── routes.ts
├── auth/                    # 认证模块
│   ├── Login/
│   ├── Register/
│   └── routes.ts
└── routes/
    └── index.tsx            # 总路由入口，汇总所有模块
```

### 7.2 模块路由配置（routes.ts）

每个模块目录下创建 `routes.ts`，管理该模块所有路由：

```typescript
// pages/blog/routes.ts
import React, { lazy } from 'react';
import { RouteConfig } from '@routes/index';

// 懒加载组件
const BlogList = lazy(() => import('./BlogList'));
const BlogDetail = lazy(() => import('./BlogDetail'));
const CreateBlog = lazy(() => import('./CreateBlog'));
const EditBlog = lazy(() => import('./EditBlog'));

// 模块路由配置
export const blogRoutes: RouteConfig[] = [
  {
    path: '/blogs',
    element: <BlogList />,
    requireAuth: false,
  },
  {
    path: '/blogs/:id',
    element: <BlogDetail />,
    requireAuth: false,
  },
  {
    path: '/create',
    element: <CreateBlog />,
    requireAuth: true,
  },
  {
    path: '/blogs/:id/edit',
    element: <EditBlog />,
    requireAuth: true,
  },
];

// 模块菜单配置（可选）
export const blogMenuConfig = [
  {
    key: 'blogs',
    label: '博客',
    path: '/blogs',
    icon: <FileTextOutlined />,
  },
];
```

### 7.3 总路由入口

在 `routes/index.tsx` 中汇总所有模块路由：

```typescript
// routes/index.tsx
import React, { lazy } from "react";
import { blogRoutes } from "@pages/blog/routes";
import { userRoutes } from "@pages/user/routes";
import { authRoutes } from "@pages/auth/routes";
import { noteRoutes } from "@pages/note/routes";

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  requireAuth: boolean;
}

export interface MenuConfig {
  key: string;
  icon: React.ReactElement;
  label: string;
  path: string;
}

// 合并所有模块路由
export const routeConfig: RouteConfig[] = [
  ...authRoutes, // 认证模块（登录、注册等）
  ...blogRoutes, // 博客模块
  ...userRoutes, // 用户模块
  ...noteRoutes, // 笔记模块
  // ... 其他模块
];

// 合并所有菜单配置
export const menuConfig: MenuConfig[] = [
  // ... 汇总所有模块的菜单
];
```

### 7.4 新增页面步骤

1. 在对应模块目录下创建页面组件（如 `blog/BlogDetail/index.tsx`）
2. 在模块的 `routes.ts` 中添加路由配置
3. 在模块的 `routes.ts` 中添加菜单配置（如需要）
4. **无需修改** `routes/index.tsx`（除非是全新的顶级模块）

### 7.5 路由跳转

```typescript
const navigate = useNavigate();
navigate('/blogs/123');

<Link to={`/blogs/${id}`}>详情</Link>
```

---

## 八、国际化

所有用户可见文本**必须**国际化：

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

<Button>{t('common.submit')}</Button>
<message.success>{t('blog.createSuccess')}</message.success>
```

---

## 九、命名规范

| 对象      | 规范              | 示例                        |
| --------- | ----------------- | --------------------------- |
| 变量/函数 | camelCase         | `userList`, `handleSubmit`  |
| 组件/类型 | PascalCase        | `CommentItem`, `BlogParams` |
| 常量      | UPPER_SNAKE_CASE  | `MAX_FILE_SIZE`             |
| CSS 类名  | BEM               | `.comment-item__header`     |
| Slice     | camelCase + Slice | `authSlice`                 |
| Hook      | useXxx            | `useAuth`                   |
| API 对象  | xxxAPI            | `blogAPI`                   |

---

## 十、性能优化

```typescript
// 避免内联对象 props
const style = useMemo(() => ({ color: 'red' }), []);

// 列表回调用 useCallback
const handleDelete = useCallback((id: number) => { ... }, []);

// 纯展示子组件用 React.memo
export const Item = React.memo(({ data }: Props) => { ... });
```

---

## 十一、提交前检查

```bash
pnpm run check:ci  # lint + typecheck + test:unit
```

检查清单：

- [ ] 无 `any`、无未使用变量
- [ ] hooks 依赖完整
- [ ] 无 `console.log` / `debugger`
- [ ] 样式使用变量，文案已 i18n
- [ ] 处理了 loading/empty/error 三态
- [ ] 新接口使用 Orval 生成函数/hooks 与 `generated/model` 类型，未手改 `src/services/generated/**`

---

## 十二、输出格式

```markdown
完成：[页面/组件名]

- 改动：[文件列表 + 简要说明]
- 验证：typecheck/lint [通过/未跑]
- 风险：[无/具体风险点]
```

---

## 参考

- 仓库根目录 `CLAUDE.md`（脚本、API 响应格式、LESS 覆盖 antd 的优先级规则、Git 约定）

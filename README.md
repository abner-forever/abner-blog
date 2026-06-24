# 📝 ABNER Blog（龙码 LongMa）

<div align="center">

一个基于 **NestJS + React** 的现代化全栈博客 + 低代码平台系统，采用 **pnpm Monorepo** 架构。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-e0234e?logo=nestjs)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

[功能概览](#-功能概览) • [快速开始](#-快速开始) • [各包文档](#-各包文档) • [项目结构](#-项目结构) • [常用命令](#-常用命令)

</div>

---

## ✨ 功能概览

**用户站（web）**
- JWT / SSO 认证、博客 CRUD、Markdown 编辑
- 评论 / 点赞 / 收藏、待办事项（Schedule-X 日历视图）
- 笔记（类 Notion 富文本）、动态/朋友圈、话题
- AI 聊天（LangChain + LangGraph，流式输出、意图识别）
- 聊天分享、知识库（向量检索）、AI 技能管理
- 私信（WebSocket）、通知、系统公告
- 低代码页面渲染（page-schema 引擎）
- 搜索、天气、热搜、工具集、面试题
- 文件与分片上传、视频封面
- i18n 国际化、主题皮肤（15+ 套）、响应式布局

**低代码编辑器（editor）**
- GrapesJS Studio SDK 可视化页面编辑
- 页面管理（列表、预览、版本历史、审核、回收站）
- 低代码页面管理（pages 模块：模板、版本、表单提交、自定义组件）

**管理后台（admin）**
- 用户管理、博客管理、动态管理、评论管理
- 系统公告、数据分析（埋点、性能监控、用户列表/详情）

**后端（server）**
- NestJS 11 + TypeORM + MySQL + Redis
- AI 能力（LangChain + LangGraph）、MCP 协议服务端
- 社交模块（关注、私信、通知、WebSocket）
- 埋点 + 性能监控、SSO（Keycloak）、文件上传

**接口与数据模型** 以各应用 README 与 **Swagger**（`/api-docs`）为准。

---

## 🚀 快速开始

**环境**：Node.js ≥ 18、pnpm ≥ 8.15.4、MySQL（或 TypeORM 支持的其他库）；Redis 可选（`REDIS_ENABLED=false` 可关）。

```bash
git clone <repository-url>
cd abner-blog
pnpm install
cp apps/server/.env.example apps/server/.env   # 按文件内说明填写
pnpm run dev:services    # 启动 MySQL、Redis 等
pnpm run dev             # 启动 web + server
```

**本地访问（默认端口）**

| 端 | URL |
| -- | --- |
| 用户站 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| 低代码编辑器 | http://localhost:5175 |
| 后端 API | http://localhost:8080/api |
| Swagger | http://localhost:8080/api-docs |

后端热重载：根目录 `pnpm run dev` 或 `cd apps/server && pnpm run dev`。

---

## 📚 各包文档

详细说明已拆到子目录 **README**，避免根文档过长：

| 路径 | 内容 |
| ---- | ---- |
| [`apps/server/README.md`](./apps/server/README.md) | 后端技术栈、环境、**数据模型**、**API 文档**、测试、部署、架构 |
| [`apps/web/README.md`](./apps/web/README.md) | 用户站技术栈、**路由**、脚本、测试、Orval |
| [`apps/admin/README.md`](./apps/admin/README.md) | 管理后台脚本与说明 |
| [`apps/editor/README.md`](./apps/editor/README.md) | 低代码页面编辑器（GrapesJS Studio SDK） |
| [`packages/upload/README.md`](./packages/upload/README.md) | 分片 / 直传、预览等上传工具包 |
| [`packages/utils/README.md`](./packages/utils/README.md) | 共享工具方法 |
| [`packages/page-schema/README.md`](./packages/page-schema/README.md) | 页面渲染引擎（组件注册、中间件、事件系统） |
| [`packages/shared-ui/README.md`](./packages/shared-ui/README.md) | 共享 UI 组件（登录页、动画角色等） |
| [`packages/analytics/README.md`](./packages/analytics/README.md) | 埋点 SDK（自动追踪、性能监控） |
| [`packages/env-tool/README.md`](./packages/env-tool/README.md) | 环境工具（CSS 注入、DOM 工具） |

仓库级命令与目录约定还可参考 **[`CLAUDE.md`](./CLAUDE.md)**；Nest / React 专项开发说明见 `docs/`（若存在）。

---

## 📁 项目结构

```
abner-blog/
├── apps/
│   ├── server/     # NestJS API → README 见上
│   ├── web/        # 用户站
│   ├── admin/      # 管理后台
│   └── editor/     # 低代码页面编辑器
├── packages/
│   ├── utils/
│   ├── upload/
│   ├── page-schema/
│   ├── shared-ui/
│   ├── analytics/
│   └── env-tool/
├── docker/         # Docker Compose + Keycloak
├── docs/           # 项目文档
├── scripts/
├── package.json
├── pnpm-workspace.yaml
└── README.md       # 本文件：整体介绍
```

---

## 📜 常用命令（仓库根目录）

```bash
pnpm run dev              # web + server（含后端 watch）
pnpm run dev:web
pnpm run dev:admin
pnpm run dev:editor
pnpm run dev:server       # 仅 nest start --watch
pnpm run dev:services     # Docker 服务 (MySQL, Redis 等)

pnpm run build            # 当前通常含 web + server
pnpm run build:web
pnpm run build:server
pnpm run build:admin
pnpm run build:editor

pnpm run lint
pnpm run typecheck
pnpm run check:ci         # lint + typecheck + test:unit
pnpm run format
pnpm run generate:api     # OpenAPI → Orval（配置主要在 apps/web）

pnpm run test:unit
pnpm run test:e2e:server
pnpm run test:e2e:web

pnpm run commit
pnpm run semantic-release
```

**工程化**：pnpm、Turbo、ESLint、Prettier、Husky、Commitlint、Commitizen 等。

---

## 🤝 贡献

1. Fork 本仓库  
2. 创建分支：`git checkout -b feature/AmazingFeature`  
3. 提交：`git commit -m 'feat: add some AmazingFeature'`（推荐使用 `pnpm run commit`）  
4. 推送并发起 Pull Request  

提交前建议执行 `pnpm run check:ci`；约定式提交与钩子见 `CLAUDE.md`。

---

## 🎉 现状与说明

Monorepo 含 **server / web / admin / editor** 四端与 **`packages/utils`、`packages/upload`、`packages/page-schema`、`packages/shared-ui`、`packages/analytics`、`packages/env-tool`**；联调以 **Swagger** 与 **Orval 生成客户端** 为准。若文档与实现不一致，以 **源码与 Swagger** 为准。

---

## 📝 可选方向（非路线图）

- Redis 与缓存策略优化
- 更完整的 Docker / 编排示例
- 测试与 E2E 覆盖扩充
- 低代码编辑器能力增强（自定义组件市场、更多内置组件）  

---

## 🐛 已知问题

暂无集中列表；问题请通过 Issue 反馈。

---

## 📄 许可证

[ISC](LICENSE)

---

## 👥 作者

**abner** — [1661287843@qq.com](mailto:1661287843@qq.com)

---

## 🙏 致谢

[NestJS](https://nestjs.com/) · [React](https://reactjs.org/) · [TypeScript](https://www.typescriptlang.org/) · [Ant Design](https://ant.design/) · [TypeORM](https://typeorm.io/)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by abner

</div>

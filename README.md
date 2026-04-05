# 📝 ABNER Blog

<div align="center">

一个基于 **NestJS + React** 的现代化全栈博客系统，采用 **pnpm Monorepo** 架构。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-e0234e?logo=nestjs)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

[功能概览](#-功能概览) • [快速开始](#-快速开始) • [各包文档](#-各包文档) • [项目结构](#-项目结构) • [常用命令](#-常用命令)

</div>

---

## ✨ 功能概览

用户与 **JWT** 认证、博客 **CRUD**、Markdown、评论 / 点赞 / 收藏、待办、文件与分片上传（[`@abner-blog/upload`](./packages/upload/README.md)）、笔记与动态、消息与 **WebSocket** 聊天、**i18n**、主题与响应式布局、管理后台（`apps/admin`）。**接口与数据模型**以各应用 README 与 **Swagger**（`/api-docs`）为准。

---

## 🚀 快速开始

**环境**：Node.js ≥ 18、pnpm ≥ 8.15.4、MySQL（或 TypeORM 支持的其他库）；Redis 可选（`REDIS_ENABLED=false` 可关）。

```bash
git clone <repository-url>
cd abner-blog
pnpm install
cp apps/server/.env.example apps/server/.env   # 按文件内说明填写
pnpm run dev
```

**本地访问（默认端口以各应用配置为准）**

| 端 | URL |
| -- | --- |
| 用户站 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
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
| [`packages/upload/README.md`](./packages/upload/README.md) | 分片 / 直传、预览等上传工具包 |
| [`packages/utils/README.md`](./packages/utils/README.md) | 共享工具方法 |

仓库级命令与目录约定还可参考 **[`CLAUDE.md`](./CLAUDE.md)**；Nest / React 专项开发说明见 `docs/`（若存在）。

---

## 📁 项目结构

```
abner-blog/
├── apps/
│   ├── server/     # NestJS API → README 见上
│   ├── web/        # 用户站
│   └── admin/      # 管理后台
├── packages/
│   ├── utils/
│   └── upload/
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
pnpm run dev:server      # 仅 nest start（无 watch）

pnpm run build            # 当前通常含 web + server，不含 admin 时请用 build:admin
pnpm run build:web
pnpm run build:server
pnpm run build:admin

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

Monorepo 含 **server / web / admin** 三端与 **`packages/utils`、`packages/upload`**；联调以 **Swagger** 与 **Orval 生成客户端** 为准。若文档与实现不一致，以 **源码与 Swagger** 为准。

---

## 📝 可选方向（非路线图）

- 评论回复、分类、关注等社区能力  
- Redis 与缓存策略  
- 更完整的 Docker / 编排示例  
- 测试与 E2E 覆盖扩充  

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

# 变更提案

> 本目录管理对 `specs/` 中规范文档的变更提案（changes），遵循 OpenSpec 变更流程。

## 目录结构

```
changes/
├── README.md                               # 本文件
├── archive/                                # 已实施的变更归档
│   ├── 2026-06-28-page-generator-ai/       # 示例：OpenSpec 工具自动归档
│   │   └── .openspec.yaml
│   ├── ai-chat-review/                     # 一次性审阅文档
│   │   └── review.md
│   ├── low-code-platform-progress/         # 进度追踪（非 spec，移入此处归档）
│   │   └── progress.md
│   └── low-code-platform-roadmap/          # 路线图（非 spec，移入此处归档）
│       └── roadmap.md
└── <feature-name>/                         # 活跃的变更提案（示例）
    ├── proposal.md                         # 必须：变更提案
    ├── tasks.md                            # 可选：任务分解
    └── specs/                              # 可选：提案附带的新/修改的规范
```

## 流程

### 发起变更

1. 新建 `changes/<feature-name>/` 目录
2. 编写 `proposal.md`，至少包含：
   - **Motivation**（动机）：为什么需要这个变更
   - **Proposal**（提案）：具体变更内容
   - **Impact**（影响分析）：对现有 spec、代码、架构的影响
   - **Non-goals**（非目标）：明确不做什么
3. 可选：编写 `tasks.md` 分解实施步骤，附文件路径
4. 可选：在 `specs/` 下放置新/修改的 spec 文件

### 审批与实施

- 提案经讨论确认后，更新 `specs/` 中的对应规范
- `tasks.md` 中的任务逐项勾选完成

### 归档

- 变更实施完成后，将 `changes/<feature-name>/` 移入 `changes/archive/`
- 保留 `proposal.md` 和原始 spec 以供历史追溯

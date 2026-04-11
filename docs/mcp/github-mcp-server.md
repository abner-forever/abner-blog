# GitHub MCP HTTP 服务快速接入

本文用于把 GitHub 集成接入到本项目的「MCP 市场」中。

## 0. 直接使用项目内置路由（推荐）

当前仓库已经内置 GitHub MCP HTTP 路由：`POST /api/mcp/github`。

你无需额外部署独立服务，只需在服务端配置环境变量：

```bash
GITHUB_TOKEN=ghp_xxx_or_fine_grained_token
MCP_SERVER_BEARER_TOKEN=your_mcp_server_secret
```

然后在 MCP 配置面板填写：

- `URL`: `https://your-domain.com/api/mcp/github`
- `Bearer Token`: `MCP_SERVER_BEARER_TOKEN`（若已配置）

> 下面的独立服务方式保留为可选方案。

## 1. 部署远端服务

示例代码见：`docs/mcp/github-mcp-server-example.ts`

最小依赖：

```bash
pnpm add express
```

环境变量：

```bash
export PORT=3001
export GITHUB_TOKEN=ghp_xxx_or_fine_grained_token
export MCP_SERVER_BEARER_TOKEN=your_mcp_server_secret
```

启动：

```bash
node github-mcp-server-example.ts
```

> 生产环境建议放在独立服务并通过 nginx/caddy 反向代理到 `https://your-server.com/mcp/github`。

## 2. 在 MCP 市场安装 GitHub 集成

当前项目已内置 `github` 市场项，并预置默认配置骨架：

- `url`: `https://your-server.com/mcp/github`
- `timeoutMs`: `12000`
- `headers`: `{}`

安装后你只需在「配置」里改成真实 URL，并填写 Bearer Token（如果远端服务启用了鉴权）。

## 3. 面板联调顺序

1. 点击「测试连接」
2. 点击「连接诊断」
3. 点击「同步工具」
4. 聊天里发 GitHub 相关请求（如“列出某仓库 open issues”）

## 4. 常见问题

- `initialize` 失败：URL 不通、证书、反代路径或鉴权错误
- `tools/list` 失败：服务未实现该 MCP 方法
- `tools/call` 失败：工具参数不匹配或 `GITHUB_TOKEN` 权限不足

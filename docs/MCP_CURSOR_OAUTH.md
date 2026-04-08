# MCP Cursor OAuth 接入说明

本文档用于说明本项目 MCP 服务如何通过 Cursor 的 Connect 流程完成授权，并提供常见故障排查。

## 当前能力

- 标准 MCP `streamableHttp` 接入（`POST /api/mcp` + `GET /api/mcp` + `DELETE /api/mcp`）
- OAuth 2.0 Authorization Code + PKCE
- Cursor 原生 Connect（未登录返回 `401 + WWW-Authenticate` challenge）
- 兼容部分客户端默认根路径 OAuth 调用（`/register`、`/authorize`、`/token`）

## 关键端点

- 资源元数据：`GET /api/mcp/.well-known/oauth-authorization-server`
- 授权端点：`GET /api/mcp/oauth/authorize`
- 授权确认：`POST /api/mcp/oauth/approve`
- 令牌交换：`POST /api/mcp/oauth/token`
- 动态注册：`POST /api/mcp/oauth/register`
- 兼容入口：`POST /register`、`GET /authorize`、`POST /token`

## OAuth 约束

- 仅允许 `client_id = cursor-local`
- 仅允许以下回调地址：
  - `cursor://mcp-auth-callback`
  - `cursor://anysphere.cursor-mcp/oauth/callback`
- `state` 最大长度：1024
- `code_challenge_method`：`S256` 或 `plain`

## Cursor 端配置示例

`~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "MyTools": {
      "url": "http://localhost:8080/api/mcp"
    }
  }
}
```

## 常见问题排查

- `Cannot POST /register`
  - 检查服务是否包含根路径兼容注册端点 `POST /register`。
- `Cannot GET /authorize`
  - 检查全局前缀排除是否包含 `GET /authorize`。
- `Cannot POST /token`
  - 检查全局前缀排除是否包含 `POST /token`。
- `Failed to open SSE stream: Not Found`
  - 检查 `GET /api/mcp` 是否已实现并交给 MCP transport 处理。
- Connect 后仍回到未登录
  - 检查回调 `redirect_uri` 与服务端白名单是否一致。

## 上线建议

- Redis 需启用，保证 token 与 MCP 会话状态可持久化。
- 反向代理（Nginx/Ingress）需允许长连接与流式响应。
- 建议补充 OAuth 全链路 e2e 测试（成功/过期/PKCE 错误/redirect 不匹配）。

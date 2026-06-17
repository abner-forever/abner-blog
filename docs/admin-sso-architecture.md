# Admin 管理后台 SSO 统一登录架构设计

## 1. 需求背景与目标

### 1.1 当前状态

abner-blog 的 admin 管理后台当前采用**独立用户名密码 + JWT Bearer Token** 的认证方式：

- 登录：`POST /admin/auth/login` → 服务端验证用户名密码 → 返回 JWT（30天有效）
- 存储：前端将 token 保存在 `localStorage`（key: `admin-token`）
- 请求：axios 拦截器读取 `localStorage`，添加 `Authorization: Bearer <token>` 请求头
- 401 处理：清除 `localStorage`，跳转 `/login`

### 1.2 核心痛点

| 问题 | 说明 |
|------|------|
| **无统一身份管控** | 每个管理项目各自维护登录逻辑，缺乏全局 SSO 体验 |
| **Token 安全风险** | localStorage 存储的 JWT 易受 XSS 攻击窃取 |
| **无法全局注销** | 无服务端会话概念，token 在有效期内无法主动失效 |
| **不可复用** | 未来新增管理项目需重复实现认证逻辑 |

### 1.3 目标架构原则

1. **统一身份源**：Keycloak 作为集中身份提供商（IdP），接管所有管理系统的认证
2. **BFF 桥接模式**：NestJS 后端作为 BFF（Backend for Frontend），处理 OIDC 流程，发放 HttpOnly Cookie
3. **服务端会话**：Redis 存储会话，支持主动吊销和滑窗过期
4. **渐进迁移**：保留现有用户名密码登录，支持双模式并行
5. **多项目复用**：SSO 模块可被其他 NestJS 管理项目直接使用

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        浏览器（同主域名下）                       │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Admin A (React)  │  │ Admin B (React)  │  ...                │
│  │ port 3001        │  │ port 3002        │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │  HttpOnly Cookie    │  HttpOnly Cookie              │
│           │  (自动携带)         │  (自动携带)                   │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API 网关 (Nginx / APISIX)                      │
│  (未来阶段) ─ 统一入口、Cookie 校验、路由分发、Cookie 剥离        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS BFF (同一服务实例)                       │
│                                                                  │
│  ┌─────────────────────┐   ┌──────────────────────────────┐     │
│  │  Admin Module       │   │  SSO Module (新增)            │     │
│  │  ─ 业务 API          │   │  ─ OIDC 流程处理              │     │
│  │  ─ AdminGuard        │   │  ─ Session 管理 (Redis)      │     │
│  │  ─ AdminJwtStrategy  │   │  ─ SSOSessionStrategy        │     │
│  └──────────┬──────────┘   │  ─ 用户映射                    │     │
│             │              └──────────────┬─────────────────┘     │
│             ▼                             ▼                       │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              AuthGuard(['admin-jwt', 'sso-session'])      │     │
│  │              双认证模式并行（迁移阶段）                     │     │
│  └──────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
       ┌──────────────────┐          ┌──────────────────┐
       │   MySQL (业务数据) │          │     Redis         │
       │   ─ 用户表         │          │  ─ sso:session:*  │
       │   ─ sso_identity  │          │  ─ sso:state:*    │
       └──────────────────┘          └──────────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │   Keycloak (IdP)          │
                              │   Docker Compose 部署     │
                              │   Realm: abner-blog       │
                              │   Client: admin-sso       │
                              └──────────────────────────┘
```

---

## 3. OIDC 认证流程详解

### 3.1 核心流程：OIDC Authorization Code + PKCE

```
┌──────────┐         ┌──────────┐         ┌──────────┐       ┌──────────┐
│ 前端浏览器 │         │ BFF      │         │ Keycloak │       │  Redis   │
│ (Admin)   │         │ (NestJS) │         │ (IdP)    │       │          │
└─────┬─────┘         └────┬─────┘         └────┬─────┘       └────┬─────┘
      │                    │                    │                  │
      │ 1. 点击 SSO 登录    │                    │                  │
      │──────────────────►│                    │                  │
      │                    │ 2. 生成 state      │                  │
      │                    │   + code_verifier  │                  │
      │                    │───────────────────│──────存 state ──►│
      │                    │                    │                  │
      │ 3. 302 重定向       │                    │                  │
      │◄───────────────────│                    │                  │
      │                    │                    │                  │
      │ 4. 浏览器跳转       │                    │                  │
      │─────────────────────────────────────────►│                  │
      │                    │                    │                  │
      │ 5. 用户认证          │                    │                  │
      │◄─────────────────────────────────────────│                  │
      │                    │                    │                  │
      │ 6. 授权码回调        │                    │                  │
      │──────────────────►│                    │                  │
      │                    │ 7. 验证 state       │                  │
      │                    │───────────────────│─────查询 state──►│
      │                    │◄──────────────────│─────返回 state──│
      │                    │                    │                  │
      │                    │ 8. 授权码换 Token    │                  │
      │                    │──────────────────────────────────►│
      │                    │◄──────────────────────────────────│
      │                    │                    │                  │
      │                    │ 9. 验证 ID Token    │                  │
      │                    │  (JWKS 公钥验签)    │                  │
      │                    │                    │                  │
      │                    │ 10. 查询/创建本地用户│                  │
      │                    │  (sso_identity 表)  │                  │
      │                    │                    │                  │
      │                    │ 11. 创建 Session    │                  │
      │                    │───────────────────│──存 session ────►│
      │                    │                    │                  │
      │ 12. Set-Cookie     │                    │                  │
      │    sso_session={id}│                    │                  │
      │◄───────────────────│                    │                  │
      │    + 302 redirect  │                    │                  │
      │                    │                    │                  │
      │ 13. 携带 Cookie    │                    │                  │
      │    请求 API        │                    │                  │
      │──────────────────►│                    │                  │
      │                    │ 14. 查 Redis 会话    │                  │
      │                    │───────────────────│───────查 session─►│
      │                    │◄──────────────────│───────用户信息───│
      │                    │                    │                  │
      │◄───────────────────│                    │                  │
      │  200 OK + 业务数据  │                    │                  │
      │                    │                    │                  │
```

### 3.2 阶段一：发起认证

| 步骤 | 细节 |
|------|------|
| 触发方式 | 用户在登录页点击"使用 SSO 登录"按钮 |
| 前端行为 | `window.location.href = '/api/sso/authorize'`（整页跳转） |
| BFF 端点 | `GET /api/sso/authorize` |
| BFF 动作 | 生成 `state`（32字节随机，防 CSRF）+ `code_verifier`（48字节随机），计算 `code_challenge = base64url(sha256(code_verifier))`，将 state 存入 Redis（TTL 10分钟） |
| 响应 | 302 重定向至 Keycloak 登录页，携带 OIDC 参数 |

### 3.3 阶段二：回调处理

| 步骤 | 细节 |
|------|------|
| 回调端点 | `GET /api/sso/callback?code=xxx&state=yyy` |
| **注意** | 此端点必须**排除**在全局 `/api` 前缀外 |
| 验证 state | 查 Redis 中 `sso:state:{state}`，防止 CSRF 攻击 |
| Token 交换 | POST 到 Keycloak token endpoint，携带 `code` + `code_verifier` + `client_id` + `client_secret` |
| ID Token 验证 | 用 Keycloak JWKS 端点获取公钥，验证签名、issuer、audience、过期时间 |

### 3.4 阶段三：用户映射与 Session 创建

**映射逻辑优先级（`SSOUserMappingService`）：**

1. 查询 `sso_identity` 表：`keycloak_sub = ID Token 中的 sub` → 找到本地 `user.id`
2. 若未找到，尝试按邮箱匹配：`User.email = ID Token 中的 email` → 关联并写入 `sso_identity`
3. 若仍未找到且 `SSO_AUTO_PROVISION=true`：自动创建本地 User（role=admin），写入 `sso_identity`
4. 若自动创建关闭且无匹配 → 返回 403 "未授权访问"

**Session 数据（Redis）：**

```
Key:   sso:session:{uuid}
Value: {
  "userId": 1,
  "username": "zhangsan",
  "role": "admin",
  "keycloakSub": "a1b2c3d4-...",
  "email": "zhangsan@example.com",
  "createdAt": "2026-06-17T10:00:00Z",
  "lastActivityAt": "2026-06-17T10:00:00Z"
}
TTL: 28800s (8小时，滑窗刷新)
```

**Cookie 设置（响应头）：**

```
Set-Cookie: sso_session={uuid};
  HttpOnly;
  Secure;              // 生产环境 HTTPS 下启用
  SameSite=Lax;        // 允许同站导航携带
  Path=/api;           // 仅发送给 API 请求
  Max-Age=28800;
```

### 3.5 阶段四：认证 API 请求

**请求链路：**

1. 浏览器自动携带 `sso_session` Cookie → `GET /api/admin/blogs`
2. Vite 开发代理 → `localhost:8080/api/admin/blogs`
3. `cookie-parser` 中间件解析 Cookie → `req.cookies.sso_session`
4. `SSOSessionStrategy`（Passport）：
   - 读取 `req.cookies.sso_session`
   - 查 Redis `sso:session:{sessionId}`
   - 若有效：刷新 TTL，返回 `{ userId, username, role }` → `req.user`
   - 若无效/过期：返回 `UnauthorizedException`
5. `AdminGuard`（现有）：检查 `req.user.role === 'admin'`

**双认证模式的守卫链：**

```typescript
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
// 1. admin-jwt 策略先尝试（读取 Authorization: Bearer header）
// 2. 若没有 Bearer token，尝试 sso-session 策略（读取 cookie）
// 3. 任一策略成功即通过认证
// 4. AdminGuard 校验 role === 'admin'
```

### 3.6 阶段五：登出

```
POST /api/sso/logout → Cookie: sso_session=xxx
```

1. BFF 删除 Redis 中 `sso:session:{sessionId}`
2. 返回 `Set-Cookie: sso_session=; Max-Age=0`（清除 cookie）
3. 前端跳转到 `/login`

---

## 4. 组件设计

### 4.1 SSO 模块结构

```
apps/server/src/modules/sso/
├── sso.module.ts                    # 模块定义
├── sso.constants.ts                 # 常量
├── sso.module-definition.ts         # forRoot/forRootAsync 定义
├── interfaces/
│   ├── sso-module-options.interface.ts
│   └── session-data.interface.ts
├── controllers/
│   └── sso-auth.controller.ts       # 认证端点
├── services/
│   ├── sso-oidc.service.ts          # OIDC 协议核心
│   ├── sso-session.service.ts       # Session CRUD
│   └── sso-user-mapping.service.ts  # 用户映射
├── guards/
│   └── sso-session.guard.ts         # Cookie 守卫
├── strategies/
│   └── sso-session.strategy.ts      # Passport 策略
├── decorators/
│   └── current-sso-user.decorator.ts
└── dto/
    └── sso-status.dto.ts
```

### 4.2 核心服务职责

#### SSOOidcService

| 方法 | 职责 |
|------|------|
| `onModuleInit()` | 获取并缓存 Keycloak `/.well-known/openid-configuration` |
| `fetchJwksKeys()` | 获取并缓存 JWKS 公钥（内存 TTL 缓存，默认 1小时） |
| `generateAuthorizationUrl(state, codeChallenge)` | 构建 Keycloak 授权 URL |
| `exchangeCodeForTokens(code, codeVerifier)` | 授权码换 Token（access_token, id_token, refresh_token） |
| `validateIdToken(idToken)` | 验证 ID Token 签名、iss、aud、exp |
| `getKeycloakLogoutUrl()` | 构建 Keycloak 端登出 URL（可选） |

#### SSOSessionService

| 方法 | 职责 |
|------|------|
| `createSession(user, keycloakSub, email): string` | 生成 uuid，存入 Redis，返回 sessionId |
| `getSession(sessionId): SessionData \| null` | 查 Redis，返回 session 数据或 null |
| `deleteSession(sessionId)` | 删除 Redis 键 |
| `refreshSessionTTL(sessionId)` | 滑动刷新 TTL |

#### SSOUserMappingService

| 方法 | 职责 |
|------|------|
| `findOrCreateLocalUser(keycloakClaims)` | 按 sub/email 映射，按配置自动创建 |
| `linkIdentity(localUserId, keycloakSub)` | 写入 sso_identity 关联表 |
| `unlinkIdentity(keycloakSub)` | 删除关联（可选） |

### 4.3 新增实体

**SSOIdentity**

```typescript
@Entity('sso_identities')
export class SSOIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'keycloak_sub' })
  keycloakSub: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'keycloak' })
  idp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 5. 配置项

### 5.1 后端配置（`apps/server/.env`）

```bash
# =============================================
# Keycloak / SSO Configuration
# =============================================
SSO_ENABLED=true

# Keycloak 基础信息
KEYCLOAK_ISSUER_URL=http://localhost:8082/realms/abner-blog
SSO_CLIENT_ID=admin-sso
SSO_CLIENT_SECRET=your-client-secret

# BFF 回调地址（需在 Keycloak Client 中注册）
SSO_CALLBACK_URL=http://localhost:8080/api/sso/callback

# Session 设置
SSO_SESSION_TTL_SECONDS=28800
SSO_COOKIE_DOMAIN=
SSO_COOKIE_SECURE=false

# 用户映射
SSO_AUTO_PROVISION=true
SSO_DEFAULT_ROLE=admin
```

### 5.2 前端配置（`apps/admin/.env`）

```bash
VITE_SSO_ENABLED=true
VITE_SSO_AUTHORIZE_URL=/api/sso/authorize
```

---

## 6. 本地开发环境

### 6.1 Docker Compose（Keycloak）

```yaml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.1.0
    environment:
      KC_DB: mysql
      KC_DB_URL: jdbc:mysql://keycloak-db:3306/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8082:8080"
    command: start-dev --import-realm
    volumes:
      - ./docker/keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
    depends_on:
      - keycloak-db

  keycloak-db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: keycloak
      MYSQL_USER: keycloak
      MYSQL_PASSWORD: keycloak
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3307:3306"
    volumes:
      - keycloak-db-data:/var/lib/mysql

volumes:
  keycloak-db-data:
```

### 6.2 Keycloak Realm 配置

需在 Keycloak 中创建：

- **Realm**: `abner-blog`
- **Client**: `admin-sso`
  - Client authentication: ON（机密客户端）
  - Standard flow: ON
  - Valid redirect URIs: `http://localhost:8080/api/sso/callback`
  - Post logout redirect URIs: `http://localhost:3001/*`
  - Web origins: `http://localhost:3001`
- **用户**: 手动创建测试用户，或后续集成 LDAP

> 可使用 `docker/keycloak/realm-export.json` 预配置 realm，启动时自动导入。

---

## 7. 多项目复用方案

### 7.1 共享包结构

```
packages/nest-sso/
├── src/
│   ├── sso.module.ts
│   ├── sso.constants.ts
│   ├── sso.module-definition.ts
│   ├── interfaces/
│   │   ├── sso-module-options.interface.ts
│   │   ├── session-data.interface.ts
│   │   └── user-mapper.interface.ts
│   ├── controllers/
│   │   └── sso-auth.controller.ts
│   ├── services/
│   │   ├── sso-oidc.service.ts
│   │   └── sso-session.service.ts
│   ├── guards/
│   │   └── sso-session.guard.ts
│   ├── strategies/
│   │   └── sso-session.strategy.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 7.2 使用方式（其他项目）

```typescript
// 在任意 NestJS 项目中：
@Module({
  imports: [
    SSOModule.forRoot({
      issuerUrl: 'http://keycloak:8082/realms/abner-blog',
      clientId: 'admin-sso',
      clientSecret: '...',
      callbackUrl: 'http://my-app:8080/api/sso/callback',
      sessionTtlSeconds: 28800,
      autoProvision: true,
      defaultRole: 'admin',
    }),
  ],
})
export class AppModule {}
```

### 7.3 Cookie 跨域共享

- 所有管理项目部署在同一主域名下（如 `*.abner-blog.com`）
- Cookie 设置 `Domain=.abner-blog.com` 实现跨子域共享
- API 网关统一入口，验证 Cookie 后分发到不同后端服务

---

## 8. 安全注意事项

| 风险点 | 防护措施 |
|--------|----------|
| XSS 窃取 Token | 使用 HttpOnly Cookie，JS 无法读取 |
| CSRF 跨站请求 | SameSite=Lax 限制跨站 POST；state 参数防 OIDC CSRF |
| Session 固定攻击 | 每次登录生成全新 sessionId |
| 会话劫持 | Redis 存储 + HTTPS 传输 |
| 重放攻击 | OIDC 授权码一次性使用（Keycloak 保证） |
| 用户停用 | 每次 session 验证时检查 DB 用户状态 |
| Redis 不可用 | 配置开关控制：fail closed（拒绝服务）或 fail open |

---

## 9. 迁移策略

### 阶段 0：基础设施搭建
- 添加依赖（openid-client, cookie-parser）
- Docker Compose 部署 Keycloak
- 创建 SSOIdentity 实体
- 配置环境变量

### 阶段 1：SSO 认证流程
- 实现 OIDC Authorization Code + PKCE 流程
- 实现 Redis Session 管理
- 实现用户映射服务
- 完成登录/回调/登出端点
- 测试端到端 Keycloak 登录

### 阶段 2：后端认证集成
- 实现 SSOSessionStrategy（Passport）
- 所有 admin 控制器同时接受 Bearer token 和 Cookie 两种认证
- 创建 `@UseAdminAuth` 辅助装饰器简化守卫组合

### 阶段 3：前端集成
- 登录页添加 SSO 按钮
- App 启动时检查 SSO 登录态
- 401 处理适配 Cookie 场景
- Redux 适配 authMethod

### 阶段 4：加固与复用
- 安全加固（用户状态检查、限流）
- 提取 `packages/nest-sso/` 共享包
- 编写使用文档

---

## 10. 已验证的关键接口

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/sso/authorize` | GET | 无 | 发起 OIDC 登录 |
| `/api/sso/callback` | GET | 无 | OIDC 回调处理 |
| `/api/sso/logout` | POST | Cookie | 登出当前会话 |
| `/api/sso/status` | GET | Cookie | 获取当前登录用户信息 |
| `/api/admin/auth/login` | POST | 无 | 保留：传统用户名密码登录 |
| `/api/admin/auth/profile` | GET | Bearer / Cookie | 获取当前管理员信息 |

---

## 11. 环境依赖

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | crypto.randomUUID 支持 |
| Redis | >= 6.x | 会话存储 |
| MySQL | >= 8.0 | 业务数据库 + Keycloak 自身存储 |
| Docker | 20.x+ | Keycloak 本地部署 |
| Keycloak | 26.1.0 | 身份提供者 |
| openid-client | ^6.x | OIDC 客户端库 |
| cookie-parser | ^1.4.x | Cookie 解析中间件 |

---

## 附录 A：名词解释

| 术语 | 说明 |
|------|------|
| **BFF** | Backend For Frontend，为前端服务的中后端 |
| **IdP** | Identity Provider，身份提供者 |
| **OIDC** | OpenID Connect，基于 OAuth 2.0 的身份认证协议 |
| **PKCE** | Proof Key for Code Exchange，授权码流程的安全增强 |
| **JWKS** | JSON Web Key Set，公钥集合用于验证 JWT |
| **SSO** | Single Sign-On，单点登录 |
| **state** | OIDC 参数，用于防止 CSRF 攻击 |
| **code_verifier** | PKCE 参数，客户端生成的随机字符串 |
| **code_challenge** | code_verifier 的哈希值，发送给授权服务器 |

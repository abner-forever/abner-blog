# @abner-blog/shared-ui

共享 UI 组件库，包含登录页、动画角色等可复用组件。

## 功能

- **登录页**：预构建的登录页面组件
- **动画角色**：GSAP 驱动的动画角色组件
- **可复用**：在 web、admin、editor 间共享

## 安装

```bash
pnpm add @abner-blog/shared-ui
```

## 使用

```tsx
import { LoginPage, AnimatedCharacter } from '@abner-blog/shared-ui';

function App() {
  return (
    <div>
      <LoginPage />
      <AnimatedCharacter type="robot" />
    </div>
  );
}
```

## 组件

### LoginPage

预构建的登录页面组件，支持：
- 用户名密码登录
- 邮箱验证码登录
- SSO 单点登录
- 忘记密码流程

### AnimatedCharacter

GSAP 驱动的动画角色组件，支持多种角色类型和动画效果。

## 相关文档

- 仓库总览：[根目录 `README.md`](../../README.md)
- 用户站：[`apps/web`](../../apps/web/README.md)
- 管理后台：[`apps/admin`](../../apps/admin/README.md)

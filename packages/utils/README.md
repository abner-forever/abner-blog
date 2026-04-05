# @abner-blog/utils

Monorepo 共享工具包（`packages/utils`），`package.json` 描述为「通用工具方法」。

## 使用方式

```json
"@abner-blog/utils": "workspace:*"
```

```ts
import { ... } from '@abner-blog/utils';
```

## 当前导出

入口为 [`index.ts`](./index.ts)，目前导出：

- `debounce`（见 [`debounce.ts`](./debounce.ts)）

随业务扩展可继续在此包内新增模块并统一从 `index.ts` 导出。

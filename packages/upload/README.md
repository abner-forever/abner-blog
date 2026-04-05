# @abner-blog/upload

Monorepo 工作区包，目录为 `packages/upload`。通用文件上传能力，与 `package.json` 描述一致：**分片上传、简单直传、图片预览、视频预览**。依赖 [spark-md5](https://github.com/satazor/js-spark-md5)（内容指纹等场景）。

## 在应用中使用

在 `apps/web`、`apps/admin` 或 `apps/server` 的 `package.json` 中声明：

```json
"@abner-blog/upload": "workspace:*"
```

在仓库根目录执行 `pnpm install` 后：

```ts
import {
  Uploader,
  ChunkUploader,
  SimpleUploader,
  ImagePreview,
  VideoPreview,
  PreviewManager,
  previewManager,
} from '@abner-blog/upload';
```

## 主要导出（`src/index.ts`）

| 类别 | 导出 |
| ---- | ---- |
| 核心 | `Uploader`、`ChunkUploader`、`SimpleUploader` |
| 预览 | `ImagePreview`、`VideoPreview`、`PreviewManager`、`previewManager` |
| 其他 | 类型（`./types`）、常量（`./constants`）、文件与存储工具（`./utils/file`、`./utils/storage`） |

## 与服务端配合

multipart 上传接口说明见 [`apps/server/README.md`](../../apps/server/README.md) 中的「文件上传接口」；具体字段与响应以 Swagger（`/api-docs`）为准。

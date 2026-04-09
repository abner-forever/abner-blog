# @abner-blog/upload

通用上传能力包（`packages/upload`），提供：

- 图片直传（`SimpleUploader`）
- 视频/大文件分片上传（`ChunkUploader`，含秒传、断点续传状态查询）
- 图片/视频预览工具（`ImagePreview`、`VideoPreview`、`PreviewManager`）

依赖 [spark-md5](https://github.com/satazor/js-spark-md5) 进行文件内容哈希计算。

## 安装与导入

在业务应用（`apps/web`、`apps/admin`）的 `package.json` 中声明：

```json
"@abner-blog/upload": "workspace:*"
```

根目录执行安装：

```bash
pnpm install
```

导入：

```ts
import {
  FileType,
  UploadStatus,
  SimpleUploader,
  ChunkUploader,
  ImagePreview,
  VideoPreview,
  PreviewManager,
  previewManager,
} from '@abner-blog/upload';
```

## 快速开始

### 1) 图片上传（直传）

```ts
import { FileType, SimpleUploader, UploadStatus } from '@abner-blog/upload';

const uploader = new SimpleUploader({
  type: FileType.IMAGE,
  baseUrl: '', // 同源时留空；跨域时填 https://api.example.com
  imageBusinessPath: 'notes',
  imageMarkdownResponse: false,
  onProgress: (task) => console.log('progress', task.progress),
});

const task = await uploader.upload(file);
if (task.status === UploadStatus.COMPLETED && task.url) {
  console.log('image url:', task.url);
}
```

### 2) 视频/文件上传（分片）

```ts
import { ChunkUploader, FileType, UploadStatus } from '@abner-blog/upload';

const uploader = new ChunkUploader({
  type: FileType.VIDEO, // 或 FileType.FILE
  baseUrl: '',
  chunkKind: 'video', // 可选；不填时 VIDEO=>video，其它=>file
  chunkBusinessPath: 'notes',
  chunkSize: 2 * 1024 * 1024, // 默认 2MB
  concurrency: 1, // 当前项目创建笔记场景建议 1
  retries: 3,
  onProgress: (task) => console.log(task.progress),
});

const task = await uploader.upload(file);
if (task.status === UploadStatus.COMPLETED && task.url) {
  console.log('video/file url:', task.url);
}
```

## UploadOptions 关键配置

通用配置（`UploadOptions`）：

- `type`: 文件类型（`FileType.IMAGE | VIDEO | FILE`）
- `baseUrl`: API 根地址，默认 `''`（同源）
- `authTokenStorageKey`: token 存储 key；不填默认尝试 `user-token`、`access_token`
- `chunkKind`: 分片资源类型（`video | file`）
- `imageBusinessPath`: 图片上传时 query 参数 `businessPath`
- `imageMarkdownResponse`: 图片上传时附加 `markdown=1`
- `chunkSize`: 分片大小，默认 `2MB`
- `concurrency`: 分片并发数，默认 `3`
- `maxSize`: 最大文件大小，默认 `2GiB`
- `allowedTypes`: 允许的 MIME 类型白名单
- `retries`: 分片重试次数，默认 `3`
- 回调：`onProgress` / `onComplete` / `onError`

`ChunkUploader` 额外配置：

- `chunkBusinessPath`: 分片上传业务目录，默认 `common`

## 接口接入说明（重点）

### 鉴权约定

上传器会自动读取 localStorage 中的 token，并通过请求头发送：

```http
Authorization: Bearer <token>
```

读取顺序：

1. 若配置 `authTokenStorageKey`，优先读取该 key
2. 否则依次读取 `user-token`、`access_token`

### 需要后端提供的接口

#### A. 图片直传（`SimpleUploader`）

1. `POST /api/upload/image`
2. 请求体：`multipart/form-data`，字段 `file`
3. 可选 query：
   - `businessPath`（来自 `imageBusinessPath`）
   - `markdown=1`（当 `imageMarkdownResponse=true`）
4. 响应需可解析出 `url`，支持两种格式：
   - 直接返回：`{ url: string }`
   - 包装返回：`{ success: true, data: { url: string } }`

#### B. 分片上传（`ChunkUploader`）

1. 初始化  
   `POST /api/upload/chunk/init`  
   `Content-Type: application/json`

   请求体示例：

   ```json
   {
     "kind": "video",
     "businessPath": "notes",
     "filename": "demo.mp4",
     "fileSize": 123456,
     "fileHash": "md5_hash",
     "totalChunks": 12,
     "mimeType": "video/mp4"
   }
   ```

   响应示例：

   ```json
   {
     "uploadId": "xxx",
     "skipUpload": false,
     "url": ""
   }
   ```

2. 上传分片  
   `POST /api/upload/chunk`  
   请求体：`multipart/form-data`，字段：
   - `file`（当前分片 blob）
   - `uploadId`
   - `chunkIndex`
   - `totalChunks`

3. 查询状态  
   `GET /api/upload/chunk/status/:uploadId`

   响应需包含：

   ```json
   {
     "uploadedChunks": [0, 1, 2],
     "totalChunks": 12,
     "progress": 25
   }
   ```

4. 合并分片  
   `POST /api/upload/chunk/merge`  
   `Content-Type: application/json`，请求体：

   ```json
   { "uploadId": "xxx" }
   ```

   响应需可解析出 `url`（同样支持 `{ success: true, data: ... }` 包装）。

5. 取消上传（可选但推荐）  
   `POST /api/upload/chunk/cancel/:uploadId`

> 说明：当前实现支持普通 JSON 与 `{ success: true, data }` 包装响应。

## 在项目中的接入参考

`apps/web` 已接入示例：

- 图片上传：`apps/web/src/pages/note/CreateNote/utils/upload.ts` 中 `uploadImages`
- 视频分片上传：同文件中的 `uploadVideo` / `uploadVideos`
- 视频封面上传：同文件中的 `uploadVideoCover`

可直接按该文件的参数约定复用（如 `chunkBusinessPath: 'notes'`、`concurrency: 1`）。

## 主要导出

| 类别 | 导出 |
| ---- | ---- |
| 核心 | `Uploader`、`SimpleUploader`、`ChunkUploader` |
| 预览 | `ImagePreview`、`VideoPreview`、`PreviewManager`、`previewManager` |
| 工具 | `./utils/file`、`./utils/storage` |
| 类型与常量 | `./types`、`./constants` |

## 调试建议

- 分片异常优先检查：`/init` 参数、`uploadId` 一致性、后端 `uploadedChunks` 写入逻辑
- 出现「秒传但 URL 为空」时，检查 `skipUpload=true` 分支返回体是否包含 `url`
- 前端上传失败时，先在网络面板确认接口状态码与响应结构是否符合上述约定

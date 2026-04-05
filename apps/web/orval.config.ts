import { defineConfig } from 'orval';

/**
 * Orval 代码生成配置
 *
 * 运行 `pnpm generate:api` 从后端 OpenAPI 规范自动生成：
 *   - TypeScript 类型（src/services/generated/model/）
 *   - Axios API 请求函数（src/services/generated/<tag>.ts）
 *   - TanStack Query hooks（src/services/generated/<tag>.ts 内联）
 *
 * 前置条件：后端服务必须在 http://localhost:8080 运行（公开 API JSON：`/api-docs-json`）
 */
export default defineConfig({
  blogApi: {
    input: {
      target: 'http://localhost:8080/api-docs-json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/services/generated',
      schemas: 'src/services/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: 'src/services/http.ts',
          name: 'httpMutator',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
        operations: {},
      },
    },
  },
});

import { defineConfig } from "orval";

/**
 * Admin 后台 API 生成配置
 *
 * 运行 `pnpm generate:api` 从后端 OpenAPI 规范自动生成：
 *   - TypeScript 类型（src/services/generated/model/）
 *   - Axios API 请求函数（src/services/generated/admin/）
 *
 * 前置条件：后端服务必须在 http://localhost:8080 运行
 */
export default defineConfig({
  adminApi: {
    input: {
      target: "http://localhost:8080/api-docs-json",
    },
    output: {
      mode: "single",
      target: "src/services/generated/admin.ts",
      schemas: "src/services/generated/model",
      client: "axios",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "src/services/http.ts",
          name: "httpMutator",
        },
        query: {
          useQuery: false,
          useMutation: false,
        },
        header: false,
      },
    },
  },
});

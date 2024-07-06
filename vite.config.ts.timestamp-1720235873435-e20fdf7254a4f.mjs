// vite.config.ts
import { defineConfig } from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/vite@5.2.7_@types+node@20.12.7_less@4.2.0/node_modules/vite/dist/node/index.js";
import react from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/@vitejs+plugin-react@1.3.2/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { ViteEjsPlugin } from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/vite-plugin-ejs@1.7.0_vite@5.2.7/node_modules/vite-plugin-ejs/index.js";
import babel from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/vite-plugin-babel@1.2.0_@babel+core@7.24.3_vite@5.2.7/node_modules/vite-plugin-babel/dist/index.mjs";
import autoprefixer from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/autoprefixer@10.4.19_postcss@8.4.38/node_modules/autoprefixer/lib/autoprefixer.js";
import stylelint from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/stylelint@16.3.1_typescript@4.9.5/node_modules/stylelint/lib/index.mjs";
import pxtorem from "file:///D:/backup/code/my-code/abner-blog/node_modules/.pnpm/postcss-pxtorem@6.1.0_postcss@8.4.38/node_modules/postcss-pxtorem/index.js";
var __vite_injected_original_dirname = "D:\\backup\\code\\my-code\\abner-blog";
var vite_config_default = defineConfig(({}) => {
  return {
    plugins: [
      babel(),
      react(),
      ViteEjsPlugin((viteConfig) => {
        return {
          root: viteConfig.root,
          title: "Abner\u7684\u7B14\u8BB0",
          env: viteConfig.mode,
          __APP_VERSION__: process.env.PKM_VERSION || process.env.npm_package_version
        };
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src"),
        "@page": path.resolve(__vite_injected_original_dirname, "src/page"),
        "@img": path.resolve(__vite_injected_original_dirname, "src/assets/img"),
        "@node_modules": path.resolve(__vite_injected_original_dirname, "node_modules")
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          // 支持内联 JavaScript
          javascriptEnabled: true,
          additionalData: `@import "${path.resolve(
            __vite_injected_original_dirname,
            "src/assets/styles/variable.less"
          )}";`
        }
      },
      postcss: {
        plugins: [
          stylelint({ fix: true }),
          // Include stylelint plugin
          pxtorem({ propList: ["*"] }),
          // Include postcss-pxtorem plugin
          process.env.NODE_ENV === "production" && autoprefixer({
            overrideBrowserslist: [
              "last 5 versions"
            ]
          })
        ].filter(Boolean)
      }
    },
    server: {
      port: 3e3,
      host: true,
      proxy: {
        "/dev_api": {
          // 调试本地node服务使用
          target: "http://localhost:8080",
          rewrite: (path2) => path2.replace(/^\/dev_api/, "/api")
        },
        "/api": {
          target: "https://foreverheart.top",
          changeOrigin: true
        }
      },
      open: "index.html"
    },
    build: {
      // 调整打包后文件放置路径
      assetsDir: "static",
      sourcemap: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        output: {
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        }
      }
    },
    esbuild: {
      define: {
        this: "window"
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxiYWNrdXBcXFxcY29kZVxcXFxteS1jb2RlXFxcXGFibmVyLWJsb2dcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGJhY2t1cFxcXFxjb2RlXFxcXG15LWNvZGVcXFxcYWJuZXItYmxvZ1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovYmFja3VwL2NvZGUvbXktY29kZS9hYm5lci1ibG9nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBWaXRlRWpzUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWVqc1wiO1xyXG5pbXBvcnQgYmFiZWwgZnJvbSBcInZpdGUtcGx1Z2luLWJhYmVsXCI7XHJcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcclxuaW1wb3J0IHN0eWxlbGludCBmcm9tICdzdHlsZWxpbnQnO1xyXG5pbXBvcnQgcHh0b3JlbSBmcm9tICdwb3N0Y3NzLXB4dG9yZW0nO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7fSkgPT4ge1xyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIGJhYmVsKCksXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIFZpdGVFanNQbHVnaW4odml0ZUNvbmZpZyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHJvb3Q6IHZpdGVDb25maWcucm9vdCxcclxuICAgICAgICAgIHRpdGxlOiBcIkFibmVyXHU3Njg0XHU3QjE0XHU4QkIwXCIsXHJcbiAgICAgICAgICBlbnY6IHZpdGVDb25maWcubW9kZSxcclxuICAgICAgICAgIF9fQVBQX1ZFUlNJT05fXzogcHJvY2Vzcy5lbnYuUEtNX1ZFUlNJT04gfHwgcHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbixcclxuICAgICAgICB9O1xyXG4gICAgICB9KSxcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxyXG4gICAgICAgIFwiQHBhZ2VcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvcGFnZVwiKSxcclxuICAgICAgICBcIkBpbWdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvYXNzZXRzL2ltZ1wiKSxcclxuICAgICAgICBcIkBub2RlX21vZHVsZXNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJub2RlX21vZHVsZXNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgY3NzOiB7XHJcbiAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgICBsZXNzOiB7XHJcbiAgICAgICAgICAvLyBcdTY1MkZcdTYzMDFcdTUxODVcdTgwNTQgSmF2YVNjcmlwdFxyXG4gICAgICAgICAgamF2YXNjcmlwdEVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICBhZGRpdGlvbmFsRGF0YTogYEBpbXBvcnQgXCIke3BhdGgucmVzb2x2ZShcclxuICAgICAgICAgICAgX19kaXJuYW1lLFxyXG4gICAgICAgICAgICBcInNyYy9hc3NldHMvc3R5bGVzL3ZhcmlhYmxlLmxlc3NcIlxyXG4gICAgICAgICAgKX1cIjtgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHBvc3Rjc3M6IHtcclxuICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICBzdHlsZWxpbnQoeyBmaXg6IHRydWUgfSksIC8vIEluY2x1ZGUgc3R5bGVsaW50IHBsdWdpblxyXG4gICAgICAgICAgcHh0b3JlbSh7IHByb3BMaXN0OiBbJyonXSB9KSwgLy8gSW5jbHVkZSBwb3N0Y3NzLXB4dG9yZW0gcGx1Z2luXHJcbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nICYmIGF1dG9wcmVmaXhlcih7XHJcbiAgICAgICAgICAgIG92ZXJyaWRlQnJvd3NlcnNsaXN0OiBbXHJcbiAgICAgICAgICAgICAgXCJsYXN0IDUgdmVyc2lvbnNcIlxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICBcIi9kZXZfYXBpXCI6IHtcclxuICAgICAgICAgIC8vIFx1OEMwM1x1OEJENVx1NjcyQ1x1NTczMG5vZGVcdTY3MERcdTUyQTFcdTRGN0ZcdTc1MjhcclxuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjgwODBcIixcclxuICAgICAgICAgIHJld3JpdGU6IHBhdGggPT4gcGF0aC5yZXBsYWNlKC9eXFwvZGV2X2FwaS8sIFwiL2FwaVwiKSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiL2FwaVwiOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IFwiaHR0cHM6Ly9mb3JldmVyaGVhcnQudG9wXCIsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgb3BlbjogXCJpbmRleC5odG1sXCIsXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgLy8gXHU4QzAzXHU2NTc0XHU2MjUzXHU1MzA1XHU1NDBFXHU2NTg3XHU0RUY2XHU2NTNFXHU3RjZFXHU4REVGXHU1Rjg0XHJcbiAgICAgIGFzc2V0c0RpcjogXCJzdGF0aWNcIixcclxuICAgICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAyNCxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwianMvW25hbWVdLVtoYXNoXS5qc1wiLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwianMvW25hbWVdLVtoYXNoXS5qc1wiLFxyXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IFwic3RhdGljL1tleHRdL1tuYW1lXS1baGFzaF0uW2V4dF1cIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGVzYnVpbGQ6IHtcclxuICAgICAgZGVmaW5lOiB7XHJcbiAgICAgICAgdGhpczogXCJ3aW5kb3dcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1IsU0FBUyxvQkFBb0I7QUFDNVQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxrQkFBa0I7QUFDekIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sYUFBYTtBQVBwQixJQUFNLG1DQUFtQztBQVV6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxDQUFDLE1BQU07QUFDbEMsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sY0FBYyxnQkFBYztBQUMxQixlQUFPO0FBQUEsVUFDTCxNQUFNLFdBQVc7QUFBQSxVQUNqQixPQUFPO0FBQUEsVUFDUCxLQUFLLFdBQVc7QUFBQSxVQUNoQixpQkFBaUIsUUFBUSxJQUFJLGVBQWUsUUFBUSxJQUFJO0FBQUEsUUFDMUQ7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsUUFDbEMsU0FBUyxLQUFLLFFBQVEsa0NBQVcsVUFBVTtBQUFBLFFBQzNDLFFBQVEsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLFFBQ2hELGlCQUFpQixLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gscUJBQXFCO0FBQUEsUUFDbkIsTUFBTTtBQUFBO0FBQUEsVUFFSixtQkFBbUI7QUFBQSxVQUNuQixnQkFBZ0IsWUFBWSxLQUFLO0FBQUEsWUFDL0I7QUFBQSxZQUNBO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLFNBQVM7QUFBQSxVQUNQLFVBQVUsRUFBRSxLQUFLLEtBQUssQ0FBQztBQUFBO0FBQUEsVUFDdkIsUUFBUSxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUFBO0FBQUEsVUFDM0IsUUFBUSxJQUFJLGFBQWEsZ0JBQWdCLGFBQWE7QUFBQSxZQUNwRCxzQkFBc0I7QUFBQSxjQUNwQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxZQUFZO0FBQUE7QUFBQSxVQUVWLFFBQVE7QUFBQSxVQUNSLFNBQVMsQ0FBQUEsVUFBUUEsTUFBSyxRQUFRLGNBQWMsTUFBTTtBQUFBLFFBQ3BEO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsT0FBTztBQUFBO0FBQUEsTUFFTCxXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUEsTUFDWCxzQkFBc0I7QUFBQSxNQUN0Qix1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K

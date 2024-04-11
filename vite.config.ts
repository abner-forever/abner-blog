import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import babel from "vite-plugin-babel";

// https://vitejs.dev/config/
export default defineConfig(({}) => {
  return {
    plugins: [
      babel(),
      react(),
      ViteEjsPlugin(viteConfig => {
        return {
          root: viteConfig.root,
          title: "Abner的笔记",
          env: viteConfig.mode,
          __APP_VERSION__: process.env.npm_package_version,
        };
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@page": path.resolve(__dirname, "src/page"),
        "@img": path.resolve(__dirname, "src/assets/img"),
        "@node_modules": path.resolve(__dirname, "node_modules"),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          // 支持内联 JavaScript
          javascriptEnabled: true,
          additionalData: `@import "${path.resolve(
            __dirname,
            "src/assets/styles/variable.less"
          )}";`,
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        "/dev_api": {
          // 调试本地node服务使用
          target: "http://localhost:8080",
          rewrite: path => path.replace(/^\/dev_api/, "/api"),
        },
        "/api": {
          target: "https://foreverheart.top",
          changeOrigin: true,
        },
      },
      open: "index.html",
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
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
    esbuild: {
      define: {
        this: "window",
      },
    },
  };
});

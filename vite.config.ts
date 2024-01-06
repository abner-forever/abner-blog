import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { ViteEjsPlugin } from 'vite-plugin-ejs'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ["decorators-legacy"],
        },
        plugins: [
          ["@babel/plugin-transform-react-jsx"],
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    }),
    ViteEjsPlugin((viteConfig) => {
      return {
        root: viteConfig.root,
        title: "Abner的笔记",
        env: viteConfig.mode
      }
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
        // 重写 less 变量，定制样式
        modifyVars: {
          "@primary-color": "#009a61",
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/dev_api": { // 调试本地node服务使用
        target: "http://localhost:8080",
        // changeOrigin: true,
        rewrite: path => path.replace(/^\/dev_api/, '/api'),
      },
      "/api": {
        target: "http://foreverheart.top:8080",
        // changeOrigin: true,
      },
      "/commonstatic": {
        target: "http://foreverheart.top:8080",
        // changeOrigin: true,
      },
    },
    open: 'index.html'
  },
  build: {  // 调整打包后文件放置路径
    assetsDir: "static/img/",
    sourcemap:true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        manualChunks: {
          lodash: ['lodash'],
          'braft-editor': ['braft-editor'],
          'antd': ['antd'],
        },
        // manualChunks(id, { getModuleInfo, getModuleIds }) {
        //   if (id.includes('node_modules')) {
        //     return 'vendor';
        //   }
        // },
      },
    },
  },
  esbuild: {
    define: {
      this: 'window'
    }
  }
});
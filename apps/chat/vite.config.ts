import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("node_modules/react-router") || id.includes("node_modules/react-redux") || id.includes("node_modules/@reduxjs/toolkit") || id.includes("node_modules/use-sync-external-store") || id.includes("node_modules/scheduler/") || id.includes("node_modules/immer")) {
            return "vendor-core";
          }
          if (id.includes("node_modules/antd") || id.includes("node_modules/@ant-design")) {
            return "vendor-antd";
          }
          if (id.includes("node_modules/react-markdown") || id.includes("node_modules/remark-") || id.includes("node_modules/react-syntax-highlighter") || id.includes("node_modules/prismjs") || id.includes("node_modules/highlight") || id.includes("node_modules/lowlight") || id.includes("node_modules/refractor") || id.includes("node_modules/rehype") || id.includes("node_modules/unified") || id.includes("node_modules/unist") || id.includes("node_modules/mdast") || id.includes("node_modules/hast") || id.includes("node_modules/trim-") || id.includes("node_modules/decode-") || id.includes("node_modules/ccount") || id.includes("node_modules/character-") || id.includes("node_modules/comma-") || id.includes("node_modules/longest-") || id.includes("node_modules/markdown") || id.includes("node_modules/zwitch") || id.includes("node_modules/property-") || id.includes("node_modules/space-") || id.includes("node_modules/trough") || id.includes("node_modules/vfile") || id.includes("node_modules/web-namespaces") || id.includes("node_modules/is-plain-obj")) {
            return "vendor-markdown";
          }
          if (id.includes("node_modules/axios") || id.includes("node_modules/dayjs") || id.includes("node_modules/fuse.js") || id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next") || id.includes("node_modules/classnames") || id.includes("node_modules/html-parse") || id.includes("node_modules/dom-") || id.includes("node_modules/css-select") || id.includes("node_modules/css-what") || id.includes("node_modules/cheerio") || id.includes("node_modules/parse5") || id.includes("node_modules/entities")) {
            return "vendor-utils";
          }
          if (id.includes("node_modules/modern-screenshot")) {
            return "vendor-screenshot";
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: `@import "@/styles/variables.less";`,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@pages": resolve(__dirname, "src/pages"),
      "@services": resolve(__dirname, "src/services"),
      "@store": resolve(__dirname, "src/store"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3002,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/assets": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

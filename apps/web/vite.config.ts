import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { PreRenderedAsset, PreRenderedChunk } from 'rollup';
import ChangeEnvPlugin from './plugins/change-env-plugin';

/**
 * 构建产物静态资源根目录（相对 outDir）。
 * 仅改 `build.assetsDir` 不够：若下面 rollup `*FileNames` 仍写 `assets/`，打包出来还是 assets。
 */
const STATIC_ROOT = 'static';

/** 从 resolve id 解析 node_modules 包名（兼容 npm / pnpm 嵌套路径） */
function getNodeModulePackageName(id: string): string | undefined {
  const segments = id.split(/[/\\]/);
  const idx = segments.lastIndexOf('node_modules');
  if (idx === -1) return undefined;
  const scope = segments[idx + 1];
  if (scope?.startsWith('@') && segments[idx + 2]) {
    return `${scope}/${segments[idx + 2]}`;
  }
  return segments[idx + 1];
}

function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;

  const pkg = getNodeModulePackageName(id);
  // 未解析到包名时不强制拆包，避免与业务 chunk 形成循环引用
  if (!pkg) return undefined;

  // 顺序：先匹配更具体的包名，避免被宽泛规则吃掉
  if (pkg === '@tanstack/react-query') return 'vendor-query';
  if (pkg === 'react-router' || pkg === 'react-router-dom') return 'vendor-router';
  // antd 与 rc-* / @rc-component 同栈，需同 chunk，否则易出现 vendor <-> vendor-antd 循环
  if (
    pkg.startsWith('@ant-design/') ||
    pkg === 'antd' ||
    pkg.startsWith('rc-') ||
    pkg.startsWith('@rc-component/')
  ) {
    return 'vendor-antd';
  }
  if (pkg === 'framer-motion') return 'vendor-motion';
  if (
    pkg === 'i18next' ||
    pkg === 'react-i18next' ||
    pkg === 'i18next-browser-languagedetector'
  ) {
    return 'vendor-i18n';
  }
  if (pkg === 'axios') return 'vendor-axios';
  if (pkg === '@reduxjs/toolkit' || pkg === 'react-redux' || pkg === 'redux' || pkg === 'immer') {
    return 'vendor-redux';
  }
  if (
    pkg === 'md-editor-rt' ||
    pkg === 'react-markdown' ||
    pkg === 'remark-gfm' ||
    pkg === 'react-syntax-highlighter' ||
    pkg === 'highlight.js' ||
    pkg === 'lowlight' ||
    pkg === 'refractor' ||
    pkg.startsWith('remark-') ||
    pkg.startsWith('mdast-') ||
    pkg.startsWith('micromark') ||
    pkg.startsWith('hast-util-') ||
    pkg.startsWith('unist-util-') ||
    pkg.startsWith('vfile') ||
    pkg === 'property-information' ||
    pkg === 'comma-separated-tokens' ||
    pkg === 'space-separated-tokens'
  ) {
    return 'vendor-markdown';
  }
  if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') {
    return 'vendor-react';
  }

  // 其余依赖交给 Rollup 按引用图拆分，避免单一 vendor 与命名 chunk 互相引用
  return undefined;
}

function assetFileNames(assetInfo: PreRenderedAsset): string {
  const name = assetInfo.name ?? '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';

  if (/^(png|jpe?g|gif|svg|webp|avif|bmp|ico|tiff?)$/i.test(ext)) {
    return `${STATIC_ROOT}/images/[name]-[hash][extname]`;
  }
  if (/^(woff2?|eot|ttf|otf)$/i.test(ext)) {
    return `${STATIC_ROOT}/fonts/[name]-[hash][extname]`;
  }
  if (ext === 'css') {
    return `${STATIC_ROOT}/css/[name]-[hash][extname]`;
  }
  if (/^(mp4|webm|ogg|mp3|wav)$/i.test(ext)) {
    return `${STATIC_ROOT}/media/[name]-[hash][extname]`;
  }
  return `${STATIC_ROOT}/misc/[name]-[hash][extname]`;
}

function chunkFileNames(chunk: PreRenderedChunk): string {
  if (chunk.name.startsWith('vendor-')) {
    return `${STATIC_ROOT}/js/vendor/[name]-[hash].js`;
  }
  return `${STATIC_ROOT}/js/[name]-[hash].js`;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ChangeEnvPlugin({
      enable: false,
    }),
  ],
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
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@types': resolve(__dirname, 'src/types'),
      '@routes': resolve(__dirname, 'src/routes'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 后端上传等静态资源；前端打包在 /static/，与此路径不冲突
      '/assets': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    /** 与 rollup 自定义 *FileNames 保持一致；仅改此处不会改 chunk 路径 */
    assetsDir: STATIC_ROOT,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks,
        entryFileNames: `${STATIC_ROOT}/js/[name]-[hash].js`,
        chunkFileNames,
        assetFileNames,
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: ['@ant-design/cssinjs', /rc-/],
  },
});

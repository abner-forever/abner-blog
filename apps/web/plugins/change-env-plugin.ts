import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

const ENVS_SCRIPT_PUBLIC_PATH = '/envtool.iife.js';

interface ChangeEnvPluginOptions {
  enable?: boolean;
  customInitStr?: string | null;
}

function resolveEnvToolIifePath(): string {
  const pkgJson = require.resolve('@abner-blog/env-tool/package.json');
  const iife = path.join(path.dirname(pkgJson), 'dist', 'envtool.iife.js');
  if (!fs.existsSync(iife)) {
    throw new Error(
      '[change-env-plugin] 未找到 @abner-blog/env-tool 的 dist/envtool.iife.js，请先执行：pnpm --filter @abner-blog/env-tool run build',
    );
  }
  return iife;
}

export default function ChangeEnvPlugin(
  options: ChangeEnvPluginOptions = {},
): Plugin {
  const defaultOptions: Required<ChangeEnvPluginOptions> = {
    enable: false,
    customInitStr: null,
    ...options,
  };

  const PLUGIN_NAME = 'vite-plugin-change-env';
  let buildOutDirAbs = '';

  return {
    name: PLUGIN_NAME,
    enforce: 'post',
    configResolved(config) {
      buildOutDirAbs = path.resolve(config.root, config.build.outDir);
      if (defaultOptions.enable) {
        resolveEnvToolIifePath();
      }
    },
    configureServer(server) {
      if (!defaultOptions.enable) return;
      const abs = resolveEnvToolIifePath();
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url !== ENVS_SCRIPT_PUBLIC_PATH) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.end(fs.readFileSync(abs));
      });
    },
    closeBundle() {
      if (!defaultOptions.enable) return;
      const abs = resolveEnvToolIifePath();
      const dest = path.join(buildOutDirAbs, 'envtool.iife.js');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
    },
    transformIndexHtml(html) {
      if (!defaultOptions.enable) return html;

      const injectStr = getInjectContent(defaultOptions.customInitStr);
      return html.replace('</body>', injectStr);
    },
  };
}

/**
 * 生成注入内容（加载 @abner-blog/env-tool IIFE，全局为 `AbnerEnvTool`）
 */
function getInjectContent(initStr: string | null): string {
  const defaultOptions = {
    entryBtnStyle: {
      zIndex: 2000,
      position: {
        left: 'auto',
        right: '10px',
        bottom: '120px',
      },
    },
  };
  return `<script>
  const s = document.createElement('script');
  s.src = "${ENVS_SCRIPT_PUBLIC_PATH}";
  s.defer = true;
  s.crossOrigin = "anonymous";
  s.onload = () => {
    ${initStr || `window.AbnerEnvTool.init(${JSON.stringify(defaultOptions)});`}
  };
  document.head.appendChild(s);
</script>
</body>`;
}

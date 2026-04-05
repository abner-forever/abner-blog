import ReactDOMServer from 'react-dom/server';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';

import App from './App';
import type { BlogDto } from '@services/generated/model';

export async function render(url: string, data: BlogDto[]) {
  const cache = createCache();

  // 2 SSR render
  const html = ReactDOMServer.renderToString(
    <StyleProvider cache={cache} hashPriority="high">
      <App blogs={data} url={url} />
    </StyleProvider>,
  );

  // 3 提取 CSS
  const styleText = extractStyle(cache, {
    plain: false,
    types: ['style', 'token', 'cssVar'],
  });

  return {
    html,
    styleText,
  };
}

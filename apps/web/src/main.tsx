// import { hydrateRoot } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.less';
import './utils/rem';
import './i18n';
import App from './App.tsx';
import type { BlogDto } from '@services/generated/model';
import { store } from './store';
import { initAnalytics, setUserId, clearUser } from '@abner/analytics';

const blogs = window.__INITIAL_DATA__ as unknown as BlogDto[];

// 初始化 analytics SDK
initAnalytics({
  appId: 'abner-blog-web',
  serverUrl: '',
  sampleRate: 0.15,
  autoTrack: true,
  debug: true,
  getToken: () => localStorage.getItem('user-token'),
});

createRoot(document.getElementById('root')!).render(<App blogs={blogs} url={''} />);

// 监听登录状态变化，同步 userId
let lastToken: string | null = null;
store.subscribe(() => {
  const state = store.getState();
  const currentToken = localStorage.getItem('user-token');

  
  if (currentToken && currentToken !== lastToken) {
    lastToken = currentToken;
    const userId = state.auth?.user?.id;
    if (userId) {
      setUserId(userId);
    }
  } else if (!currentToken && lastToken !== null) {
    lastToken = null;
    clearUser();
  }
});

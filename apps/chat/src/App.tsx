import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin, theme as antdTheme } from 'antd';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import zhCN from 'antd/es/locale/zh_CN';
import zhTW from 'antd/es/locale/zh_TW';
import enUS from 'antd/es/locale/en_US';
import { store, type RootState } from '@/store';
import { queryClient } from '@/lib/query';
import { setSSOCredentials } from '@/store/authSlice';
import { getSSOStatus } from '@/services/sso';
import { SKIN_COLORS } from '@/store/themeSlice';
import { getCurrentLocale } from '@/i18n';
import PageTransition from '@/components/PageTransition';
import { ChatProvider } from '@/pages/chat/context/ChatContext';
import Login from '@/pages/auth/Login';

const ChatPage = React.lazy(() => import('@/pages/chat'));
const ChatSharePage = React.lazy(() => import('@/pages/chat/share'));
const SettingsPage = React.lazy(() => import('@/pages/chat/settings/SettingsPage'));
const KnowledgeBasePage = React.lazy(() => import('@/pages/chat/settings/KnowledgeBasePage'));
const MCPSettingsPage = React.lazy(() => import('@/pages/chat/settings/MCPSettingsPage'));
const SkillSettingsPage = React.lazy(() => import('@/pages/chat/settings/SkillSettingsPage'));

const antdLocales: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en: enUS,
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  // 同步检查 localStorage 中是否有 token：有则无需 SSO 检查，直接渲染
  const hasLocalToken = Boolean(store.getState().auth.token);
  const [initializing, setInitializing] = useState(!hasLocalToken);
  const ssoChecked = React.useRef(false);
  const ssoAbortRef = React.useRef<AbortController | null>(null);
  const theme = useSelector((state: RootState) => state.theme.theme);
  const skin = useSelector((state: RootState) => state.theme.skin);

  const locale = getCurrentLocale();

  const isDark = useMemo(() => {
    return (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);

  // Skin primary color for Ant Design primary button / Switch / etc.
  const colorPrimary = useMemo(() => {
    const colors = SKIN_COLORS[skin];
    return colors?.primary || '#6366f1';
  }, [skin]);

  useEffect(() => {
    const checkSSO = async () => {
      if (ssoChecked.current) return;
      const { token } = (store.getState() as RootState).auth;
      if (token) {
        setInitializing(false);
        return;
      }
      ssoChecked.current = true;

      // SSO 请求最多等 3 秒，超时就放弃，展示登录页
      const controller = new AbortController();
      ssoAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const status = await Promise.race([
          getSSOStatus(),
          new Promise<null>((resolve) => {
            controller.signal.addEventListener('abort', () => resolve(null), { once: true });
          }),
        ]);
        clearTimeout(timeoutId);
        if (status && status.authenticated && status.userId && status.username && status.role) {
          dispatch(
            setSSOCredentials({
              id: status.userId,
              username: status.username,
              email: status.email,
            }),
          );
        }
      } catch {
        // SSO not available, continue to login page
      } finally {
        setInitializing(false);
      }
    };
    checkSSO();
    return () => {
      ssoAbortRef.current?.abort();
    };
  }, [dispatch]);

  if (initializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider
      locale={antdLocales[locale] || zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary,
        },
      }}
    >
      <AntdApp>
        <div className="app-container" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
          <React.Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
              </div>
            }
          >
            <ChatProvider>
              {/* 统一路由管理，所有页面通过 PageTransition 实现 iOS 风格转场动画 */}
              <Routes>
                <Route element={<PageTransition />}>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/chat/share/:shareId" element={<ChatSharePage />} />
                  <Route path="/chat/settings" element={<SettingsPage />} />
                  <Route path="/chat/settings/knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="/chat/settings/mcp" element={<MCPSettingsPage />} />
                  <Route path="/chat/settings/skills" element={<SkillSettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </ChatProvider>
          </React.Suspense>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;

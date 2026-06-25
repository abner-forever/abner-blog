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
import { getCurrentLocale } from '@/i18n';
import Login from '@/pages/auth/Login';

const ChatPage = React.lazy(() => import('@/pages/chat'));
const ChatSharePage = React.lazy(() => import('@/pages/chat/share'));

const antdLocales: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en: enUS,
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const ssoChecked = React.useRef(false);
  const theme = useSelector((state: RootState) => state.theme.theme);

  const locale = getCurrentLocale();

  const isDark = useMemo(() => {
    return (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);

  useEffect(() => {
    const checkSSO = async () => {
      if (ssoChecked.current) return;
      const { token } = (store.getState() as RootState).auth;
      if (token) {
        setInitializing(false);
        return;
      }
      ssoChecked.current = true;
      try {
        const status = await getSSOStatus();
        if (status.authenticated && status.userId && status.username && status.role) {
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
      }}
    >
      <AntdApp>
        <React.Suspense
          fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
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
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </React.Suspense>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;

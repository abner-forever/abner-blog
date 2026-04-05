import React, { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { App as AntdApp, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { getCurrentLocale } from '@/i18n';
import { antdLocales, dayjsLocales } from '@/constants';
import AppShell from '@/components/AppShell';
import SocialRealtimeBridge from '@/components/SocialRealtimeBridge';
import { BlogContext } from '@/context/blog';
import { useAntdThemeAndSkin } from '@/hooks/useAntdThemeAndSkin';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { queryClient } from '@/lib/query';
import { closeLoginModal } from '@/store/loginModalSlice';
import { store, type RootState } from '@/store';
import type { BlogDto } from '@services/generated/model';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

interface AppProps {
  blogs: BlogDto[];
  url: string;
}

const AppContent: React.FC<AppProps> = ({ blogs, url }) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { token } = useSelector((state: RootState) => state.auth);
  const loginModalState = useSelector((state: RootState) => state.loginModal);
  const [navKey] = useState(0);

  const locale = getCurrentLocale();
  dayjs.locale(dayjsLocales[locale]);

  useAppBootstrap({ dispatch, token, navKey, url });
  const antdThemeConfig = useAntdThemeAndSkin();

  const onCloseLoginModal = useCallback(() => {
    dispatch(closeLoginModal());
  }, [dispatch]);

  const shell = (
    <AppShell
      i18n={i18n}
      loginModalState={loginModalState}
      onCloseLoginModal={onCloseLoginModal}
      navKey={navKey}
    />
  );

  return (
    <ConfigProvider locale={antdLocales[locale]} theme={antdThemeConfig}>
      <AntdApp>
        <BlogContext.Provider value={blogs}>
          {typeof window === 'undefined' ? (
            <StaticRouter location={url} future={routerFutureFlags}>
              {shell}
            </StaticRouter>
          ) : (
            <BrowserRouter future={routerFutureFlags}>{shell}</BrowserRouter>
          )}
        </BlogContext.Provider>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC<AppProps> = ({ blogs, url }) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocialRealtimeBridge />
        <AppContent blogs={blogs} url={url} />
      </QueryClientProvider>
    </Provider>
  );
};

export default App;

import React, { Suspense } from 'react';
import { Layout } from 'antd';
import { Route, Routes, useLocation } from 'react-router-dom';
import type { i18n } from 'i18next';

import ErrorBoundary from '@/components/ErrorBoundary';
import Loading from '@/components/Loading';
import LoginModal from '@/components/LoginModal';
import MobilePageHeader from '@/components/MobilePageHeader';
import MobileTabBar from '@/components/MobileTabBar';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import PrivateRoute from '@/components/PrivateRoute';
import SiteFooter from '@/components/SiteFooter';
import { CUSTOM_MOBILE_HEADER_PATHS, TAB_PATHS } from '@/constants';
import { routeConfig } from '@/routes';

const { Content } = Layout;

/** 独立页面路径（无导航栏、无宽度限制） */
const STANDALONE_PATHS = ['/chat', '/chat/share'] as const;

export interface AppShellProps {
  i18n: i18n;
  loginModalState: { open: boolean };
  onCloseLoginModal: () => void;
  navKey: number;
}

const AppShell: React.FC<AppShellProps> = ({
  i18n,
  loginModalState,
  onCloseLoginModal,
  navKey,
}) => {
  const location = useLocation();
  const isMobile = window.innerWidth <= 768;
  const isTabPage = TAB_PATHS.some((path) => location.pathname === path);
  const hasCustomMobileHeader = CUSTOM_MOBILE_HEADER_PATHS.some((path) =>
    location.pathname.startsWith(path),
  );
  const isStandalonePage = STANDALONE_PATHS.some((path) =>
    location.pathname.startsWith(path),
  );

  return (
    <Layout className="app-layout">
      {isMobile && !isTabPage && !hasCustomMobileHeader && !isStandalonePage && <MobilePageHeader />}
      {!isMobile && !isStandalonePage && <Navbar />}
      <Content className={`app-content ${isMobile && isTabPage ? 'no-header' : ''} ${isStandalonePage ? 'standalone' : ''}`}>
        {isStandalonePage ? (
          <ErrorBoundary resetKey={navKey}>
            <Suspense fallback={<Loading page tip={i18n.t('common.loading')} />}>
              <PageTransition>
                <Routes>
                  {routeConfig
                    .filter((route) => route.path.startsWith('/chat'))
                    .map((route) => (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          route.requireAuth ? (
                            <PrivateRoute>{route.element}</PrivateRoute>
                          ) : (
                            route.element
                          )
                        }
                      />
                    ))}
                </Routes>
              </PageTransition>
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="main-container">
            <ErrorBoundary resetKey={navKey}>
              <Suspense fallback={<Loading page tip={i18n.t('common.loading')} />}>
                <PageTransition>
                  <Routes>
                    {routeConfig
                      .filter((route) => !route.path.startsWith('/chat'))
                      .map((route) => (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={
                            route.requireAuth ? (
                              <PrivateRoute>{route.element}</PrivateRoute>
                            ) : (
                              route.element
                            )
                          }
                        />
                      ))}
                    <Route path="*" element={<div>404</div>} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </Content>
      {!isStandalonePage && <SiteFooter />}
      {isMobile && isTabPage && <MobileTabBar />}
      <LoginModal open={loginModalState.open} onClose={onCloseLoginModal} />
    </Layout>
  );
};

export default AppShell;

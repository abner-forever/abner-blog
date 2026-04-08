import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Steps,
  Typography,
  message,
} from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

const { Paragraph, Text, Title } = Typography;

const McpConnect = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const [redirecting, setRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const redirectUri = query.get('redirect_uri');
  const state = query.get('state');
  const clientId = query.get('client_id');
  const codeChallenge = query.get('code_challenge');
  const codeChallengeMethod = query.get('code_challenge_method') || 'S256';
  const isOauthFlow = Boolean(clientId && redirectUri && codeChallenge);

  const redirectTarget = useMemo(() => {
    if (!redirectUri) return null;
    try {
      const parsed = new URL(redirectUri);
      const allowed =
        parsed.protocol === 'cursor:' ||
        (parsed.protocol === 'http:' && parsed.hostname === 'localhost') ||
        (parsed.protocol === 'https:' && parsed.hostname === 'localhost');
      if (!allowed) return null;

      if (token) parsed.searchParams.set('access_token', token);
      if (state) parsed.searchParams.set('state', state);
      parsed.searchParams.set('source', 'abner-blog-mcp');
      return parsed.toString();
    } catch {
      return null;
    }
  }, [redirectUri, token, state]);

  const loginReturnUrl = useMemo(
    () =>
      `/login?returnUrl=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
    [location.pathname, location.search],
  );

  const mcpJsonSnippet = useMemo(() => {
    if (!token) return '';
    const mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || '/api/mcp';
    return JSON.stringify(
      {
        mcpServers: {
          MyTools: {
            url: mcpServerUrl,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      },
      null,
      2,
    );
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !redirectTarget || redirecting || isOauthFlow) return;
    setRedirecting(true);
    const timer = window.setTimeout(() => {
      window.location.href = redirectTarget;
    }, 800);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, redirectTarget, redirecting, isOauthFlow]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !isOauthFlow ||
      redirecting ||
      approving ||
      Boolean(redirectError)
    ) {
      return;
    }
    const tokenValue = token;
    if (!tokenValue) return;

    const approve = async () => {
      setApproving(true);
      setRedirecting(true);
      setRedirectError(null);
      try {
        const response = await fetch('/api/mcp/oauth/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenValue}`,
          },
          body: JSON.stringify({
            clientId,
            redirectUri,
            state: state || undefined,
            codeChallenge,
            codeChallengeMethod,
          }),
        });
        if (!response.ok) {
          throw new Error(`approve failed: ${response.status}`);
        }
        const data = (await response.json()) as { redirectTo?: string };
        if (!data.redirectTo) {
          throw new Error('missing redirectTo');
        }
        window.location.href = data.redirectTo;
      } catch {
        setRedirectError(t('auth.mcpConnectApproveFailed'));
        setRedirecting(false);
        setApproving(false);
      }
    };

    void approve();
  }, [
    isAuthenticated,
    isOauthFlow,
    redirecting,
    token,
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
    approving,
    redirectError,
    t,
  ]);

  const handleRetryApprove = () => {
    if (!isOauthFlow || !isAuthenticated) return;
    setRedirectError(null);
    setApproving(false);
    setRedirecting(false);
  };

  const oauthStepIndex = !isOauthFlow
    ? 0
    : redirectError
    ? 1
    : redirecting
    ? 2
    : 1;

  const handleBackToClient = () => {
    if (!redirectTarget) {
      setRedirectError(t('auth.mcpConnectRedirectInvalid'));
      return;
    }
    window.location.href = redirectTarget;
  };

  const handleCopy = async (text: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(successText);
    } catch {
      message.error(t('common.error'));
    }
  };

  return (
    <div
      style={{
        maxWidth: 820,
        margin: '24px auto',
        padding: '0 16px',
      }}
    >
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            {t('auth.mcpConnectTitle')}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t('auth.mcpConnectSubtitle')}
          </Paragraph>

          {!isAuthenticated || !token ? (
            <Navigate to={loginReturnUrl} replace />
          ) : (
            <>
              <Alert
                type="success"
                showIcon
                message={t('auth.mcpConnectLoggedIn')}
                description={
                  isOauthFlow
                    ? t('auth.mcpConnectAuthorizeHint')
                    : t('auth.mcpConnectLoggedInDesc')
                }
              />
              {(redirectUri || isOauthFlow) && (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type={redirectTarget ? 'info' : 'error'}
                    showIcon
                    message={
                      isOauthFlow
                        ? t('auth.mcpConnectAuthorizeReady')
                        : redirectTarget
                        ? t('auth.mcpConnectRedirectReady')
                        : t('auth.mcpConnectRedirectInvalid')
                    }
                    description={
                      isOauthFlow
                        ? t('auth.mcpConnectAuthorizeHint')
                        : redirectTarget
                        ? t('auth.mcpConnectRedirectHint')
                        : t('auth.mcpConnectRedirectInvalidDesc')
                    }
                  />
                  {isOauthFlow && (
                    <Steps
                      size="small"
                      current={oauthStepIndex}
                      items={[
                        { title: t('auth.mcpConnectStepLogin') },
                        {
                          title: redirectError
                            ? t('auth.mcpConnectStepAuthorizeFailed')
                            : t('auth.mcpConnectStepAuthorize'),
                        },
                        { title: t('auth.mcpConnectStepCallback') },
                      ]}
                    />
                  )}
                </Space>
              )}
              {redirectError && (
                <Alert
                  type="error"
                  showIcon
                  message={redirectError}
                  action={
                    isOauthFlow ? (
                      <Button size="small" onClick={handleRetryApprove}>
                        {t('auth.retry')}
                      </Button>
                    ) : undefined
                  }
                />
              )}
              {redirectTarget && (
                <Space>
                  <Button type="primary" onClick={handleBackToClient}>
                    {redirecting
                      ? t('auth.mcpConnectRedirecting')
                      : t('auth.mcpConnectBackToClient')}
                  </Button>
                </Space>
              )}

              {!isOauthFlow && (
                <>
                  <div>
                    <Text strong>{t('auth.mcpConnectTokenLabel')}</Text>
                    <Input.TextArea
                      value={token}
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      readOnly
                      style={{ marginTop: 8 }}
                    />
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        onClick={() =>
                          handleCopy(token, t('auth.mcpConnectTokenCopied'))
                        }
                      >
                        {t('auth.mcpConnectCopyToken')}
                      </Button>
                    </Space>
                  </div>

                  <div>
                    <Text strong>{t('auth.mcpConnectConfigLabel')}</Text>
                    <Input.TextArea
                      value={mcpJsonSnippet}
                      autoSize={{ minRows: 10, maxRows: 18 }}
                      readOnly
                      style={{ marginTop: 8, fontFamily: 'monospace' }}
                    />
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        onClick={() =>
                          handleCopy(
                            mcpJsonSnippet,
                            t('auth.mcpConnectConfigCopied'),
                          )
                        }
                      >
                        {t('auth.mcpConnectCopyConfig')}
                      </Button>
                    </Space>
                  </div>
                </>
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default McpConnect;

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Spin, Result, Tag, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { httpMutator } from '@/services/http';
import {
  RendererProvider,
  PageRenderer,
  ModalProvider,
  ModalPortals,
  styleInjector,
  createDynamicConditionMiddleware,
  createDynamicVariableParserMiddleware,
  Container,
  Section,
  Row,
  Column,
  Text,
  Image,
  Button,
  Divider,
  Spacer,
  Video,
  BilibiliVideo,
  TencentVideo,
  Card,
  Accordion,
  Tabs,
  Carousel,
  Map,
  NavMenu,
  NavLink,
  HtmlEmbed,
  Form,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSubmit,
  DataList,
  DataBadge,
} from '@abner-blog/page-schema';
import type { PageSchema, ActionContext, SchemaNode, ModalApi, Middleware } from '@abner-blog/page-schema';

interface PageData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  schema?: PageSchema | null;
}

const PageDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchIdRef = useRef(0);
  const modalApiRef = useRef<ModalApi>({ open: () => {}, close: () => {} });

  // 共享变量存储 - actionContext 和动态中间件都使用这个
  const pageVarsRef = useRef<Record<string, unknown>>({});

  // 创建动态中间件 - 每次渲染时从 pageVarsRef 读取最新变量值
  const conditionMiddleware = useMemo<Middleware>(
    () => createDynamicConditionMiddleware(() => pageVarsRef.current),
    [],
  );
  const variableParserMiddleware = useMemo<Middleware>(
    () => createDynamicVariableParserMiddleware(() => pageVarsRef.current),
    [],
  );

  useEffect(() => {
    if (!slug) return;

    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    setError(false);

    httpMutator<PageData>({
      url: `/api/public/pages/${slug}`,
      method: 'GET',
    })
      .then((pageData) => {
        if (currentFetchId === fetchIdRef.current) {
          setData(pageData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (currentFetchId === fetchIdRef.current) {
          setError(true);
          setLoading(false);
        }
      });
  }, [slug]);

  /** 事件执行上下文工厂 — 提供 toast/navigate/变量/事件总线等运行时能力（modals 由 modalApi 注入） */
  const actionContextFactory = useCallback(
    (rootNode: SchemaNode): ActionContext => {
      const eventHandlers: Record<string, Array<(detail?: unknown) => void>> = {};

      return {
        sourceNode: rootNode,
        toast: {
          success: (msg: string) => message.success(msg),
          error: (msg: string) => message.error(msg),
          info: (msg: string) => message.info(msg),
          warning: (msg: string) => message.warning(msg),
        },
        navigate: (url: string, target: '_self' | '_blank' = '_self') => {
          if (target === '_blank') {
            window.open(url, '_blank');
          } else {
            window.location.href = url;
          }
        },
        modals: {
          open: (modalId: string, data?: Record<string, unknown>) => {
            modalApiRef.current.open(modalId, data);
          },
          close: (modalId: string) => {
            modalApiRef.current.close(modalId);
          },
        },
        // 变量操作指向共享的 pageVarsRef
        variables: {
          get: (key: string) => pageVarsRef.current[key],
          set: (key: string, value: unknown) => { pageVarsRef.current[key] = value; },
          delete: (key: string) => { delete pageVarsRef.current[key]; },
          clear: () => {
            Object.keys(pageVarsRef.current).forEach((k) => { delete pageVarsRef.current[k]; });
          },
        },
        eventBus: {
          emit: (name: string, detail?: unknown) => {
            (eventHandlers[name] || []).forEach((handler) => handler(detail));
          },
          on: (name: string, handler: (detail?: unknown) => void) => {
            if (!eventHandlers[name]) eventHandlers[name] = [];
            eventHandlers[name].push(handler);
            return () => {
              eventHandlers[name] = eventHandlers[name].filter((h) => h !== handler);
            };
          },
        },
        getRootNode: () => rootNode,
      };
    },
    [],
  );

  // 加载中和错误状态必须在 useCallback（hook 8）之后，
  // 确保 hook 数量跨渲染一致
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Result
        status="404"
        title="页面不存在"
        subTitle="该页面可能已被删除或尚未发布"
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {data.title
            ? `${data.title} - Abner's Blog`
            : "Abner's Blog"}
        </title>
        {data.description && (
          <meta name="description" content={data.description} />
        )}
        {data.keywords && data.keywords.length > 0 && (
          <meta name="keywords" content={data.keywords.join(', ')} />
        )}
        {data.ogImage && <meta property="og:image" content={data.ogImage} />}
        {data.title && <meta property="og:title" content={data.title} />}
        {data.description && (
          <meta property="og:description" content={data.description} />
        )}
      </Helmet>

      {isPreview && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(24, 144, 255, 0.95)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 2px 12px rgba(24, 144, 255, 0.4)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        >
          <EyeOutlined style={{ fontSize: 14 }} />
          预览模式
          <Tag
            style={{
              margin: 0,
              fontSize: 11,
              lineHeight: '18px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              border: 'none',
            }}
          >
            非正式发布
          </Tag>
        </div>
      )}

      <ModalProvider schema={data.schema || { root: { id: 'empty', type: 'container', props: {} } }}>
        {(modalApi) => {
          // 更新 ref，使 actionContextFactory 中的 modals 能力指向 ModalProvider 的方法
          modalApiRef.current = modalApi;
          return (
            <RendererProvider
              schema={data.schema || { root: { id: 'empty', type: 'container', props: {} } }}
              modalApi={modalApi}
              extraComponents={{
                container: Container,
                section: Section,
                row: Row,
                column: Column,
                text: Text,
                image: Image,
                button: Button,
                divider: Divider,
                spacer: Spacer,
                video: Video,
                'bilibili-video': BilibiliVideo,
                'tencent-video': TencentVideo,
                card: Card,
                accordion: Accordion,
                tabs: Tabs,
                carousel: Carousel,
                map: Map,
                'nav-menu': NavMenu,
                'nav-link': NavLink,
                'html-embed': HtmlEmbed,
                form: Form,
                'form-input': FormInput,
                'form-textarea': FormTextarea,
                'form-select': FormSelect,
                'form-checkbox': FormCheckbox,
                'form-submit': FormSubmit,
                'data-list': DataList,
                'data-badge': DataBadge,
              }}
              extraMiddlewares={[styleInjector, conditionMiddleware, variableParserMiddleware]}
              actionContextFactory={actionContextFactory}
            >
              <PageRenderer
                schema={data.schema || undefined}
                error={!data.schema?.root ? '页面内容为空' : null}
              />
              <ModalPortals />
            </RendererProvider>
          );
        }}
      </ModalProvider>
    </>
  );
};

export default PageDetail;

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Result, Button, Tag, message } from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import { pageApi, type Page } from "@/services/api";
import {
  RendererProvider,
  PageRenderer,
  styleInjector,
  Container,
  Section,
  Row,
  Column,
  Text,
  Image,
  Button as SchemaButton,
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
} from "@abner-blog/page-schema";
import type { PageSchema, ActionContext, SchemaNode } from "@abner-blog/page-schema";

const PagePreview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!slug) return;

    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    setError(false);

    // 从管理端 API 获取页面数据（支持草稿状态预览）
    pageApi
      .getBySlug(slug)
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

  /** 事件执行上下文工厂 — 提供 toast/navigate/modals/变量/事件总线等运行时能力 */
  const actionContextFactory = useCallback(
    (rootNode: SchemaNode): ActionContext => {
      const pageVars: Record<string, unknown> = {};
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
          open: (modalId: string) => {
            const el = document.getElementById(modalId);
            if (el) el.style.display = 'block';
          },
          close: (modalId: string) => {
            const el = document.getElementById(modalId);
            if (el) el.style.display = 'none';
          },
        },
        variables: {
          get: (key: string) => pageVars[key],
          set: (key: string, value: unknown) => { pageVars[key] = value; },
          delete: (key: string) => { delete pageVars[key]; },
          clear: () => {
            Object.keys(pageVars).forEach((k) => { delete pageVars[k]; });
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

  // 解析 schema（用 useMemo 保持引用稳定性，避免 actionContext 重复创建）
  const parsedSchema: PageSchema | null = useMemo(() => {
    if (!data?.schema) return null;
    try {
      return JSON.parse(data.schema) as PageSchema;
    } catch {
      return null;
    }
  }, [data?.schema]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#999" }}>正在加载页面…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Result
        status="404"
        title="页面不存在"
        subTitle="该页面可能已被删除"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
            返回页面列表
          </Button>
        }
      />
    );
  }

  const hasContent = parsedSchema?.root?.children && parsedSchema.root.children.length > 0;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* 预览模式浮标 */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(24, 144, 255, 0.95)",
          color: "#fff",
          padding: "6px 16px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: "0 2px 12px rgba(24, 144, 255, 0.4)",
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
        }}
      >
        <EyeOutlined style={{ fontSize: 14 }} />
        预览模式
        <Tag
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: "18px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.25)",
            color: "#fff",
            border: "none",
          }}
        >
          {data.status === "published" ? "已发布" : data.status === "draft" ? "草稿" : data.status}
        </Tag>
      </div>

      {/* 顶部操作栏 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          height: 48,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "0 16px 8px",
          pointerEvents: "none",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          size="small"
          onClick={() => navigate("/")}
          style={{
            pointerEvents: "auto",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          返回列表
        </Button>
      </div>

      {/* 页面内容：使用 Schema 渲染引擎 */}
      <div
        style={{
          paddingTop: 56,
          minHeight: "calc(100vh - 56px)",
        }}
      >
        {hasContent ? (
          <RendererProvider
            schema={parsedSchema!}
            extraComponents={{
              container: Container,
              section: Section,
              row: Row,
              column: Column,
              text: Text,
              image: Image,
              button: SchemaButton,
              divider: Divider,
              spacer: Spacer,
              video: Video,
              "bilibili-video": BilibiliVideo,
              "tencent-video": TencentVideo,
              card: Card,
              accordion: Accordion,
              tabs: Tabs,
              carousel: Carousel,
              map: Map,
              "nav-menu": NavMenu,
              "nav-link": NavLink,
              "html-embed": HtmlEmbed,
              form: Form,
              "form-input": FormInput,
              "form-textarea": FormTextarea,
              "form-select": FormSelect,
              "form-checkbox": FormCheckbox,
              "form-submit": FormSubmit,
              "data-list": DataList,
              "data-badge": DataBadge,
            }}
            extraMiddlewares={[styleInjector]}
            actionContextFactory={actionContextFactory}
          >
            <PageRenderer
              schema={parsedSchema!}
              error={!hasContent ? "页面内容为空" : null}
            />
          </RendererProvider>
        ) : (
          <div
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }}>📄</div>
            <div style={{ color: "#999", fontSize: 14 }}>页面暂无内容</div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/${data.id}`)}>
              去编辑
            </Button>
          </div>
        )}
      </div>

      {/* Schema CSS */}
      {parsedSchema?.css && <style>{parsedSchema.css}</style>}
    </div>
  );
};

export default PagePreview;

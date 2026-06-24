import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Tag,
  Space,
  message,
  Input,
  Image,
  Select,
  Modal,
  Form,
  Avatar,
  Dropdown,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  CheckOutlined,
  LogoutOutlined,
  GlobalOutlined,
  HistoryOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import {
  pageApi,
  statsApi,
  reviewApi,
  type Page,
  type PageQuery,
} from "@/services/api";
import { ssoLogout } from "@/services/sso";
import type { RootState } from "@/store";
import { toggleTheme } from "@/store/themeSlice";
import { setLocale } from "@/store/localeSlice";
import { logout } from "@/store/authSlice";
import StatsChart from "./StatsChart";
import "./index.less";

const { Text } = Typography;

const statusConfig: Record<string, { color: string; text: string }> = {
  draft: { color: "blue", text: "草稿" },
  published: { color: "green", text: "已发布" },
  archived: { color: "default", text: "已归档" },
};

const reviewStatusConfig: Record<string, { color: string; text: string }> = {
  draft: { color: "default", text: "未提交" },
  reviewing: { color: "orange", text: "审核中" },
  approved: { color: "green", text: "已通过" },
  rejected: { color: "red", text: "已驳回" },
};

const localeAbbr: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
};

const PageList: React.FC = () => {
  const navigate = useNavigate();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const currentLocale = useSelector((state: RootState) => state.locale.locale);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Page[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string>();
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pvMap, setPvMap] = useState<Record<number, number>>({});
  const [chartPageId, setChartPageId] = useState<number | null>(null);
  const [slugEditOpen, setSlugEditOpen] = useState(false);
  const [slugEditPageId, setSlugEditPageId] = useState<number | null>(null);
  const [slugEditValue, setSlugEditValue] = useState("");
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: PageQuery = { page, pageSize };
      if (status) params.status = status;
      if (keyword) params.keyword = keyword;
      const res = await pageApi.list(params);
      setData(res.list);
      setTotal(res.total);

      // 批量获取 PV 数据
      if (res.list.length > 0) {
        const ids = res.list.map((p: Page) => p.id);
        statsApi.getBatch(ids).then((pvResult) => {
          setPvMap(pvResult);
        });
      }
    } catch {
      message.error("加载页面列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 打开创建弹窗时自动生成随机 slug */
  useEffect(() => {
    if (createOpen) {
      const random = Math.random().toString(36).substring(2, 10);
      form.setFieldsValue({ slug: `page-${random}` });
    }
  }, [createOpen, form]);

  /* ── Handlers ───────────────────────────────────────────── */

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);
      const newPage = await pageApi.create(values);
      message.success("创建成功");
      setCreateOpen(false);
      form.resetFields();
      navigate(`/editor/${newPage.id}`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("创建失败");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await pageApi.remove(id);
      message.success("删除成功");
      fetchData();
    } catch {
      message.error("删除失败");
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await pageApi.archive(id);
      message.success("已归档");
      fetchData();
    } catch {
      message.error("归档失败");
    }
  };

  const handleClone = async (id: number) => {
    try {
      await pageApi.clone(id);
      message.success("克隆成功（草稿状态）");
      fetchData();
    } catch {
      message.error("克隆失败");
    }
  };

  const handleSlugEdit = async () => {
    if (!slugEditPageId) return;
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(slugEditValue)) {
      message.error("仅支持小写字母、数字和连字符");
      return;
    }
    try {
      await pageApi.update(slugEditPageId, { slug: slugEditValue });
      message.success("URL 标识已更新");
      setSlugEditOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "更新失败";
      message.error(msg);
    }
  };

  const handleSubmitReview = async (id: number) => {
    try {
      await reviewApi.submit(id);
      message.success("已提交审核");
      fetchData();
    } catch {
      message.error("提交审核失败，请确认页面内容已保存");
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    const isJWT = token && token !== "sso-session";

    if (isJWT) {
      dispatch(logout());
      navigate("/login", { replace: true });
      return;
    }

    // SSO 登出：通知服务端清除会话后跳转 Keycloak 登出，最终回到编辑器登录页
    try {
      const result = await ssoLogout();
      dispatch(logout());
      if (result.redirectUrl) {
        // 将 Keycloak 登出后的跳转地址改为编辑器登录页
        const url = new URL(result.redirectUrl);
        url.searchParams.set(
          "post_logout_redirect_uri",
          window.location.origin + "/login",
        );
        window.location.href = url.toString();
        return;
      }
    } catch {
      dispatch(logout());
    }
    navigate("/login", { replace: true });
  };

  /* ── Columns ────────────────────────────────────────────── */

  const columns = [
    {
      title: "封面",
      dataIndex: "cover",
      key: "cover",
      width: 80,
      render: (cover: string | undefined) => (
        <div className="page-list__cover-cell">
          {cover ? (
            <Image
              src={cover}
              alt="封面"
              className="page-list__cover-img"
              preview={{ mask: null }}
            />
          ) : (
            <div className="page-list__cover-placeholder">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 260,
      render: (title: string) => (
        <Text strong style={{ color: "var(--text-primary)" }}>
          {title}
        </Text>
      ),
    },
    {
      title: "URL 标识",
      dataIndex: "slug",
      key: "slug",
      width: 140,
      render: (slug: string, record: Page) => (
        <Button
          type="link"
          size="small"
          style={{ fontSize: 12, fontFamily: "monospace", padding: 0, height: "auto" }}
          onClick={(e) => {
            e.stopPropagation();
            setSlugEditPageId(record.id);
            setSlugEditValue(slug);
            setSlugEditOpen(true);
          }}
        >
          {slug}
        </Button>
      ),
    },
    {
      title: "语言",
      dataIndex: "locale",
      key: "locale",
      width: 70,
      render: (locale: string) => (
        <Tag color="blue" style={{ fontSize: 11, padding: "0 4px" }}>
          {localeAbbr[locale] || locale}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: "default", text: s };
        return (
          <Tag
            color={cfg.color}
            className={`page-list__status-tag page-list__status-tag--${s}`}
          >
            {cfg.text}
          </Tag>
        );
      },
    },
    {
      title: "审核",
      dataIndex: "reviewStatus",
      key: "reviewStatus",
      width: 80,
      render: (rs: string) => {
        const cfg = reviewStatusConfig[rs] || { color: "default", text: rs };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "访问量",
      key: "pv",
      width: 80,
      render: (_: unknown, record: Page) => {
        const pv = pvMap[record.id] ?? 0;
        return (
          <Button
            type="link"
            size="small"
            style={{ fontSize: 13, padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setChartPageId(record.id);
            }}
          >
            {pv.toLocaleString()}
          </Button>
        );
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(v).format("YYYY-MM-DD HH:mm")}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 200,
      render: (_: unknown, record: Page) => {
        const moreItems = [
          ...(record.status === "published"
            ? [
                {
                  key: "archive",
                  icon: <EyeOutlined />,
                  label: "归档",
                  onClick: () => handleArchive(record.id),
                },
              ]
            : []),
          ...(record.reviewStatus === "draft" && record.status !== "published"
            ? [
                {
                  key: "review",
                  icon: <CheckOutlined />,
                  label: "提交审核",
                  onClick: () => handleSubmitReview(record.id),
                },
              ]
            : []),
          { key: "clone", icon: <CopyOutlined />, label: "克隆", onClick: () => handleClone(record.id) },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "删除",
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: "确定删除此页面？",
                content: "删除后可在回收站恢复",
                okText: "确定删除",
                okType: "danger",
                cancelText: "取消",
                onOk: () => handleDelete(record.id),
              });
            },
          },
        ];
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/editor/${record.id}`)}
              className="page-list__action-btn"
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/versions/${record.id}`);
              }}
              className="page-list__action-btn"
            >
              版本
            </Button>
            {record.status === "draft" && (
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/editor/${record.id}?publish=true`)}
                className="page-list__action-btn"
              >
                发布
              </Button>
            )}
            {record.status === "published" && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => window.open(`/page/${record.slug}`, "_blank")}
                className="page-list__action-btn"
              >
                预览
              </Button>
            )}
            <Dropdown
              menu={{ items: moreItems }}
              trigger={["click"]}
            >
              <Button
                type="link"
                size="small"
                icon={<EllipsisOutlined />}
                className="page-list__action-btn"
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-list">
      {/* ── Ambient background decoration ── */}
      <div className="page-list__ambient">
        <div className="page-list__ambient-glow page-list__ambient-glow--1" />
        <div className="page-list__ambient-glow page-list__ambient-glow--2" />
      </div>

      {/* ── Header ── */}
      <header className="page-list__header">
        <div className="page-list__header-left">
          <div className="page-list__brand">
            <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="page-list__brand-text">Abner Editor</span>
          </div>
          <div className="page-list__header-divider" />
          <h1 className="page-list__title">页面管理</h1>
        </div>

        <div className="page-list__header-right">
          {user && (
            <div className="page-list__user-info">
              <Avatar
                size={28}
                style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div className="page-list__user-meta">
                <span className="page-list__user-display-name">{user.username}</span>
              </div>
              <button
                className="page-list__logout-btn"
                onClick={handleLogout}
                title="退出登录"
              >
                <LogoutOutlined />
              </button>
            </div>
          )}

          {/* ── Settings Dropdown (theme + language) ── */}
          <Dropdown
            menu={{
              items: [
                {
                  key: "theme",
                  icon: themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />,
                  label: themeMode === "dark" ? "浅色模式" : "深色模式",
                  onClick: () => dispatch(toggleTheme()),
                },
                { type: "divider" },
                {
                  key: "lang-label",
                  label: (
                    <Space size={6}>
                      <GlobalOutlined />
                      <span>语言 / Language</span>
                    </Space>
                  ),
                  disabled: true,
                  style: { cursor: "default", opacity: 0.65, fontSize: 12 },
                },
                {
                  key: "zh-CN",
                  icon: currentLocale === "zh-CN" ? <CheckOutlined /> : <span style={{ display: "inline-block", width: 14 }} />,
                  label: "简体中文",
                  onClick: () => dispatch(setLocale("zh-CN")),
                  className: currentLocale === "zh-CN" ? "page-list__locale-active" : "",
                },
                {
                  key: "en",
                  icon: currentLocale === "en" ? <CheckOutlined /> : <span style={{ display: "inline-block", width: 14 }} />,
                  label: "English",
                  onClick: () => dispatch(setLocale("en")),
                  className: currentLocale === "en" ? "page-list__locale-active" : "",
                },
              ],
            }}
            placement="bottomRight"
          >
            <button className="page-list__settings-btn">
              <SettingOutlined />
            </button>
          </Dropdown>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="page-list__content">
        {/* Toolbar */}
        <div className="page-list__toolbar">
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索页面标题…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchData(); }}
            className="page-list__search"
            allowClear
          />
          <Select
            placeholder="全部状态"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            className="page-list__status-select"
            allowClear
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
          <div className="page-list__toolbar-divider" />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            loading={logoutLoading}
            disabled={logoutLoading}
            className="page-list__create-btn"
          >
            新建页面
          </Button>
          <Button
            type="default"
            icon={<CheckOutlined />}
            onClick={() => navigate("/review")}
            className="page-list__review-btn"
          >
            审核管理
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => navigate("/trash")}
            className="page-list__trash-btn"
          >
            回收站
          </Button>
          <div className="page-list__toolbar-count">
            {total > 0 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                共 {total} 个页面
              </Text>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="page-list__table-wrapper">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 个页面`,
            }}
            className="page-list__table"
          />
        </div>
      </main>

      {/* ── Create Modal ── */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: "#1890ff" }} />
            <span>新建页面</span>
          </Space>
        }
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        confirmLoading={createLoading}
        okText="创建并编辑"
        className="page-list__modal"
      >
        <Form form={form} layout="vertical" size="middle">
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: "请输入页面标题" }]}
          >
            <Input placeholder="输入页面标题" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="URL 标识"
            rules={[
              { required: true, message: "请输入 URL 标识" },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: "仅支持小写字母、数字和连字符",
              },
            ]}
            extra="自动生成，可自定义修改，不可重复"
          >
            <Input placeholder="例如：spring-sale" />
          </Form.Item>
          <Form.Item name="locale" label="语言" initialValue="zh-CN">
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en">English</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="SEO 描述">
            <Input.TextArea rows={3} placeholder="选填，用于搜索摘要" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Slug Edit Modal ── */}
      <Modal
        title="修改 URL 标识"
        open={slugEditOpen}
        onOk={handleSlugEdit}
        onCancel={() => setSlugEditOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        className="page-list__modal"
      >
        <div style={{ padding: "8px 0" }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary, #666)" }}>
            当前页面：{data.find((p) => p.id === slugEditPageId)?.title}
          </div>
          <Input
            value={slugEditValue}
            onChange={(e) => setSlugEditValue(e.target.value)}
            placeholder="输入新的 URL 标识"
          />
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted, #999)" }}>
            仅支持小写字母、数字和连字符，不可与现有页面重复
          </div>
        </div>
      </Modal>

      {/* ── Stats Chart Modal ── */}
      <StatsChart
        open={chartPageId !== null}
        pageId={chartPageId ?? 0}
        pageTitle={data.find((p) => p.id === chartPageId)?.title}
        onClose={() => setChartPageId(null)}
      />

    </div>
  );
};

export default PageList;

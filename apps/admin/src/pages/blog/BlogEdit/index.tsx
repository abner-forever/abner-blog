import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Space,
  message,
  Card,
  Row,
  Col,
  Switch,
  Tooltip,
  Spin,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { getBlogAdminAPI } from "@/services/generated/admin";
import type {
  Blog,
  Comment,
  AdminUpdateBlogDto,
} from "@/services/generated/model";

const api = getBlogAdminAPI();

const { TextArea } = Input;

// MD 主题选项
const MD_THEMES = [
  { value: "default", label: "Default", color: "#6366f1" },
  { value: "github", label: "GitHub", color: "#24292e" },
  { value: "vuepress", label: "VuePress", color: "#3eaf7c" },
  { value: "mk-cute", label: "MK Cute", color: "#e91e63" },
  { value: "smart-blue", label: "Smart Blue", color: "#1677ff" },
  { value: "cyanosis", label: "Cyanosis", color: "#0abde3" },
] as const;

type MdTheme = (typeof MD_THEMES)[number]["value"];

const BlogEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [mdTheme, setMdTheme] = useState<MdTheme>("default");

  // 评论相关
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadBlog = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.adminBlogsControllerGetBlogById(Number(id));
      const blogData = data as unknown as Blog;
      form.setFieldsValue({
        title: blogData.title,
        summary: blogData.summary,
        content: blogData.content,
        isPublished: blogData.isPublished,
        tags: blogData.tags,
      });
      setContent(blogData.content || "");
      setMdTheme((blogData.mdTheme as MdTheme) || "default");
    } catch {
      message.error("加载失败");
      navigate("/blogs");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const result = await api.adminCommentsControllerGetBlogComments({
        page: String(commentsPagination.current),
        size: String(commentsPagination.pageSize),
        blogId: String(id),
      });
      const response = result as unknown as {
        list: Comment[];
        total: number;
      };
      setComments(response.list || []);
      setCommentsPagination((prev) => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch {
      message.error("加载评论失败");
    } finally {
      setCommentsLoading(false);
    }
    // 仅跟踪页码与 pageSize；列入完整 state 会在更新 total 时重复触发
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [id, commentsPagination.current, commentsPagination.pageSize]);

  useEffect(() => {
    if (id) {
      loadBlog();
      loadComments();
    }
  }, [id, loadBlog, loadComments]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updateData: AdminUpdateBlogDto = {
        title: values.title,
        summary: values.summary,
        content: content,
        isPublished: values.isPublished,
        tags: values.tags,
        mdTheme: mdTheme !== "default" ? mdTheme : undefined as string,
      };
      await api.adminBlogsControllerUpdateBlog(Number(id), updateData);
      message.success("保存成功");
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.adminCommentsControllerDeleteComment(commentId);
      message.success("删除成功");
      loadComments();
    } catch {
      message.error("删除失败");
    }
  };

  const handleBack = () => {
    navigate("/blogs");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <h2 style={{ margin: 0 }}>编辑文章</h2>
        </Space>
        <Space>
          <Switch
            checked={form.getFieldValue("isPublished")}
            onChange={(checked) => form.setFieldValue("isPublished", checked)}
            checkedChildren="已发布"
            unCheckedChildren="草稿"
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="文章内容">
            <Form form={form} layout="vertical">
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: "请输入标题" }]}
              >
                <Input placeholder="请输入文章标题" size="large" />
              </Form.Item>
              <Form.Item name="summary" label="摘要">
                <TextArea rows={2} placeholder="请输入文章摘要" />
              </Form.Item>
              <Form.Item label="预览主题">
                <Space wrap>
                  {MD_THEMES.map((theme) => (
                    <Tooltip key={theme.value} title={theme.label}>
                      <button
                        type="button"
                        onClick={() => setMdTheme(theme.value)}
                        style={{
                          padding: "4px 12px",
                          border:
                            mdTheme === theme.value
                              ? `2px solid ${theme.color}`
                              : "1px solid #d9d9d9",
                          borderRadius: 4,
                          background:
                            mdTheme === theme.value
                              ? `${theme.color}20`
                              : "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {theme.label}
                      </button>
                    </Tooltip>
                  ))}
                </Space>
              </Form.Item>
              <Form.Item label="内容">
                <div style={{ border: "1px solid #d9d9d9", borderRadius: 4 }}>
                  <MdEditor
                    modelValue={content}
                    onChange={setContent}
                    placeholder="请输入文章内容（支持 Markdown）"
                    previewTheme={mdTheme}
                    style={{ minHeight: 500 }}
                    toolbars={[
                      "bold",
                      "underline",
                      "italic",
                      "-",
                      "strikeThrough",
                      "title",
                      "sub",
                      "sup",
                      "-",
                      "quote",
                      "unorderedList",
                      "orderedList",
                      "task",
                      "-",
                      "codeRow",
                      "code",
                      "link",
                      "image",
                      "table",
                      "-",
                      "revoke",
                      "next",
                      "=",
                      "-",
                      "pageFullscreen",
                      "fullscreen",
                      "preview",
                      "htmlPreview",
                      "catalog",
                    ]}
                  />
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="评论管理" extra={<a onClick={loadComments}>刷新</a>}>
            <div style={{ maxHeight: 500, overflow: "auto" }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {comment.author?.username}
                    </span>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      删除
                    </Button>
                  </div>
                  <div style={{ marginTop: 4, color: "#666" }}>
                    {comment.content}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {comments.length === 0 && !commentsLoading && (
                <div
                  style={{ textAlign: "center", color: "#999", padding: 20 }}
                >
                  暂无评论
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BlogEdit;

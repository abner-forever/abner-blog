import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Space,
  message,
  Card,
  Select,
  Row,
  Col,
  Spin,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { getBlogAdminAPI } from "@/services/generated/admin";
import type {
  MomentDto,
  TopicDto,
  UpdateMomentDto,
  CommentDto,
} from "@/services/generated/model";

const api = getBlogAdminAPI();

const { TextArea } = Input;

const MomentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<TopicDto[]>([]);

  // 评论相关
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadMoment = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getAdminMomentById(Number(id));
      const momentData = data as unknown as MomentDto;
      form.setFieldsValue({
        content: momentData.content,
        images: momentData.images?.join("\n"),
        topicId: momentData.topic?.id,
      });
    } catch {
      message.error("加载失败");
      navigate("/moments");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  const loadTopics = useCallback(async () => {
    try {
      const result = await api.getAdminTopics({ page: 1, size: 100 });
      const response = result as unknown as { list: TopicDto[] };
      setTopics(response.list || []);
    } catch {
      message.error("加载话题失败");
    }
  }, []);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const response = await api.getAdminTopicComments({
        page: commentsPagination.current,
        size: commentsPagination.pageSize,
        topicId: Number(id),
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [id, commentsPagination.current, commentsPagination.pageSize]);

  useEffect(() => {
    if (id) {
      loadMoment();
      loadTopics();
      loadComments();
    }
  }, [id, loadMoment, loadTopics, loadComments]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updateData: UpdateMomentDto = {
        content: values.content,
        images: values.images?.split("\n").filter(Boolean),
        topicId: values.topicId,
      };
      await (
        api.updateAdminMoment as unknown as (
          id: number,
          data: UpdateMomentDto,
        ) => Promise<void>
      )(Number(id), updateData);
      message.success("保存成功");
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.deleteAdminComment(commentId);
      message.success("删除成功");
      loadComments();
    } catch {
      message.error("删除失败");
    }
  };

  const handleBack = () => {
    navigate("/moments");
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
          <h2 style={{ margin: 0 }}>编辑闲聊</h2>
        </Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          保存
        </Button>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="闲聊内容">
            <Form form={form} layout="vertical">
              <Form.Item name="topicId" label="话题">
                <Select
                  placeholder="选择话题"
                  allowClear
                  options={topics.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Form.Item>
              <Form.Item
                name="content"
                label="内容"
                rules={[{ required: true, message: "请输入内容" }]}
              >
                <TextArea rows={8} placeholder="请输入闲聊内容" />
              </Form.Item>
              <Form.Item name="images" label="图片链接（每行一个）">
                <TextArea rows={4} placeholder="每行一个图片URL" />
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const images = form.getFieldValue("images");
                  if (!images) return null;
                  const urls = images.split("\n").filter(Boolean);
                  if (urls.length === 0) return null;
                  return (
                    <Form.Item label="图片预览">
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {urls.map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url.trim()}
                            alt={`预览${index + 1}`}
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #f0f0f0",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ))}
                      </div>
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="评论管理" extra={<a onClick={loadComments}>刷新</a>}>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
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

export default MomentEdit;

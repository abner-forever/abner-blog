import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  message,
  Typography,
  Empty,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  RollbackOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { reviewApi, type Page } from "@/services/api";
import "./index.less";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const statusConfig: Record<string, { color: string; text: string }> = {
  draft: { color: "blue", text: "草稿" },
  published: { color: "green", text: "已发布" },
  archived: { color: "default", text: "已归档" },
};

const localeAbbr: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
};

const ReviewList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Page[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPageId, setRejectPageId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.pendingList({ page, pageSize: 20 });
      setData(res.list);
      setTotal(res.total);
    } catch {
      message.error("加载待审核列表失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await reviewApi.approve(id, "审核通过");
      message.success("审核通过，页面已自动发布");
      fetchData();
    } catch {
      message.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectPageId(id);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectPageId) return;
    if (!rejectComment.trim()) {
      message.warning("请输入驳回原因");
      return;
    }
    setActionLoading(rejectPageId);
    try {
      await reviewApi.reject(rejectPageId, rejectComment);
      message.success("已驳回");
      setRejectModalOpen(false);
      fetchData();
    } catch {
      message.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 240,
      render: (title: string, record: Page) => (
        <Space>
          <Text strong style={{ color: "var(--text-primary)" }}>
            {title}
          </Text>
          <Tag color="blue" style={{ fontSize: 10, padding: "0 3px" }}>
            {localeAbbr[record.locale] || record.locale}
          </Tag>
        </Space>
      ),
    },
    {
      title: "URL",
      dataIndex: "slug",
      key: "slug",
      width: 130,
      render: (slug: string) => (
        <Text code style={{ fontSize: 12 }}>
          {slug}
        </Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 70,
      render: (s: string) => {
        const cfg = statusConfig[s] || { color: "default", text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "提交时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(v).format("MM-DD HH:mm")}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 280,
      render: (_: unknown, record: Page) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/editor/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/page/${record.slug}`, "_blank")}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
            loading={actionLoading === record.id}
            style={{ color: "#52c41a" }}
          >
            通过
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => openRejectModal(record.id)}
            loading={actionLoading === record.id}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="review-list">
      {/* Header */}
      <header className="review-list__header">
        <div className="review-list__header-left">
          <Button
            type="text"
            icon={<RollbackOutlined />}
            onClick={() => navigate("/")}
            className="review-list__back-btn"
          />
          <h1 className="review-list__title">审核管理</h1>
          <span className="review-list__subtitle">
            待审核页面
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="review-list__content">
        {data.length === 0 && !loading ? (
          <div className="review-list__empty">
            <Empty description="暂无待审核页面" />
          </div>
        ) : (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: (p) => setPage(p),
              showTotal: (t) => `共 ${t} 个待审核页面`,
            }}
            className="review-list__table"
          />
        )}
      </main>

      {/* Reject Modal */}
      <Modal
        title="驳回原因"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: actionLoading !== null }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          请填写驳回原因，提交后页面作者将收到反馈。
        </Paragraph>
        <TextArea
          rows={4}
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="请输入驳回原因（必填）"
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default ReviewList;

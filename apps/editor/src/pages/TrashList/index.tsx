import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Typography,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { pageApi, type Page } from "@/services/api";
import "./index.less";

const { Text } = Typography;

const TrashList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Page[]>([]);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pageApi.list({ deleted: true, pageSize: 100 });
      setData(res.list);
    } catch {
      message.error("加载回收站失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id: number) => {
    try {
      await pageApi.restore(id);
      message.success("页面已恢复");
      fetchTrash();
    } catch {
      message.error("恢复失败");
    }
  };

  const handleHardRemove = async (id: number) => {
    try {
      await pageApi.hardRemove(id);
      message.success("页面已永久删除");
      fetchTrash();
    } catch {
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 260,
      render: (title: string) => (
        <Text delete style={{ color: "var(--text-secondary, #999)" }}>
          {title}
        </Text>
      ),
    },
    {
      title: "URL 标识",
      dataIndex: "slug",
      key: "slug",
      width: 160,
      render: (slug: string) => (
        <Text code style={{ fontSize: 12, opacity: 0.6 }}>
          {slug}
        </Text>
      ),
    },
    {
      title: "删除时间",
      dataIndex: "deletedAt",
      key: "deletedAt",
      width: 180,
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 240,
      render: (_: unknown, record: Page) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRestore(record.id)}
            className="trash-list__action-btn"
          >
            恢复
          </Button>
          <Popconfirm
            title="永久删除此页面？"
            description="此操作不可恢复，页面数据将彻底删除"
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
            onConfirm={() => handleHardRemove(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="trash-list__action-btn"
            >
              永久删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="trash-list">
      <div className="trash-list__ambient">
        <div className="trash-list__ambient-glow trash-list__ambient-glow--1" />
        <div className="trash-list__ambient-glow trash-list__ambient-glow--2" />
      </div>

      <header className="trash-list__header">
        <div className="trash-list__header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/pages")}
            className="trash-list__back-btn"
          >
            返回列表
          </Button>
          <div className="trash-list__header-divider" />
          <h1 className="trash-list__title">回收站</h1>
        </div>
      </header>

      <main className="trash-list__content">
        <div className="trash-list__toolbar">
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <Text type="secondary">
              回收站中的页面可以恢复或永久删除。永久删除后数据不可恢复。
            </Text>
          </Space>
          <div style={{ flex: 1 }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {data.length > 0 ? `共 ${data.length} 个已删除页面` : ""}
          </Text>
        </div>

        <div className="trash-list__table-wrapper">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={data.length > 20 ? { pageSize: 20 } : false}
            locale={{
              emptyText: <Empty description="回收站为空" />,
            }}
            className="trash-list__table"
          />
        </div>
      </main>
    </div>
  );
};

export default TrashList;

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Tag,
  Typography,
  Popconfirm,
  message,
  Spin,
  Empty,
} from "antd";
import {
  RollbackOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { versionApi, pageApi, type PageVersion, type Page } from "@/services/api";
import "./index.less";

const { Text } = Typography;

const VersionList: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const numericPageId = pageId ? parseInt(pageId, 10) : 0;

  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [pageInfo, setPageInfo] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!numericPageId) return;
    setLoading(true);
    try {
      const [versionData, pageData] = await Promise.all([
        versionApi.list(numericPageId),
        pageApi.getById(numericPageId),
      ]);
      setVersions(versionData);
      setPageInfo(pageData);
    } catch {
      message.error("加载版本列表失败");
    } finally {
      setLoading(false);
    }
  }, [numericPageId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRestore = async (versionId: number) => {
    setRestoringId(versionId);
    try {
      await versionApi.restore(numericPageId, versionId);
      message.success("已恢复到选中版本");
      navigate(`/editor/${numericPageId}`);
    } catch {
      message.error("恢复失败");
    } finally {
      setRestoringId(null);
    }
  };

  const columns = [
    {
      title: "版本",
      dataIndex: "versionNumber",
      key: "versionNumber",
      width: 100,
      render: (v: number) => <Text strong>#{v}</Text>,
    },
    {
      title: "页面标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => title || "-",
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (t: string) => (
        <Text type="secondary">
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          {dayjs(t).format("YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string | undefined, record: PageVersion) => {
        if (record.status === "published") {
          return <Tag color="green">发布版本</Tag>;
        }
        if (record.versionNumber === 1) {
          return <Tag color="blue">初始版本</Tag>;
        }
        return <Tag>草稿</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_: unknown, record: PageVersion) => (
        <Popconfirm
          title="确认恢复到此版本？"
          description="当前编辑内容将替换为该版本，恢复会创建新版本快照"
          onConfirm={() => handleRestore(record.id)}
        >
          <Button
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            loading={restoringId === record.id}
          >
            恢复
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="version-list">
      {/* Header */}
      <header className="version-list__header">
        <div className="version-list__header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="version-list__back-btn"
          >
            返回
          </Button>
          <div className="version-list__header-divider" />
          <HistoryOutlined style={{ fontSize: 18, color: "var(--brand-color, #1890ff)" }} />
          <h1 className="version-list__title">版本历史</h1>
          {pageInfo && (
            <>
              <div className="version-list__header-divider" />
              <Text type="secondary" style={{ fontSize: 14 }}>
                {pageInfo.title}
              </Text>
            </>
          )}
        </div>
        <div className="version-list__header-right">
          <Text type="secondary" style={{ fontSize: 13 }}>
            共 {versions.length} 个版本
          </Text>
        </div>
      </header>

      {/* Content */}
      <main className="version-list__content">
        <div className="version-list__table-wrapper">
          {loading ? (
            <div className="version-list__loading">
              <Spin size="large" />
            </div>
          ) : versions.length === 0 ? (
            <Empty description="暂无版本记录" style={{ padding: "80px 0" }} />
          ) : (
            <Table
              dataSource={versions}
              columns={columns}
              rowKey="id"
              pagination={false}
              className="version-list__table"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default VersionList;

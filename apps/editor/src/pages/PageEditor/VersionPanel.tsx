import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Tag,
  Timeline,
  Typography,
  Popconfirm,
  message,
  Spin,
  Empty,
} from "antd";
import {
  HistoryOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { versionApi, type PageVersion } from "@/services/api";

const { Text, Paragraph } = Typography;

interface VersionPanelProps {
  open: boolean;
  pageId: number;
  onClose: () => void;
  onRestore: () => void;
}

const VersionPanel: React.FC<VersionPanelProps> = ({
  open,
  pageId,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await versionApi.list(pageId);
      setVersions(data);
    } catch {
      message.error("加载版本列表失败");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fetchVersions]);

  const handleRestore = async (versionId: number) => {
    setRestoringId(versionId);
    try {
      await versionApi.restore(pageId, versionId);
      message.success("已恢复到选中版本");
      onRestore();
      onClose();
    } catch {
      message.error("恢复失败");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          版本历史
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      getContainer={document.body}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin />
        </div>
      ) : versions.length === 0 ? (
        <Empty description="暂无版本记录" />
      ) : (
        <Timeline
          items={versions.map((v) => ({
            color:
              v.status === "published"
                ? "green"
                : v.versionNumber === 1
                  ? "blue"
                  : "gray",
            children: (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>版本 #{v.versionNumber}</Text>
                    {v.status === "published" && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        发布版本
                      </Tag>
                    )}
                    {v.versionNumber === 1 && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        初始版本
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {dayjs(v.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </div>
                  {v.title && (
                    <Paragraph
                      ellipsis={{ rows: 1 }}
                      style={{ fontSize: 13, margin: "4px 0 0", color: "#666" }}
                    >
                      {v.title}
                    </Paragraph>
                  )}
                </div>
                <Popconfirm
                  title="确认恢复到此版本？"
                  description="当前编辑内容将替换为该版本，恢复会创建新版本快照"
                  onConfirm={() => handleRestore(v.id)}
                >
                  <Button
                    type="link"
                    size="small"
                    icon={<RollbackOutlined />}
                    loading={restoringId === v.id}
                  >
                    恢复
                  </Button>
                </Popconfirm>
              </div>
            ),
          }))}
        />
      )}
    </Modal>
  );
};

export default VersionPanel;
